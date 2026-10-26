#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Banc d'essai « Documents Substances » — comparaison de rendus PNG (PIL seulement).

Module réutilisable :
  img = Page('fichier.png', 'portrait'|'paysage')         # échelle déduite de la taille de l'image
  img.encre(zone_pt, seuil=200) → (gauche, bas, droite, haut) en points pdf-lib (origine en bas à gauche) ou None
  ecarts(a, b, zone_pt) → dict : Δ des bords de l'encre (pt), pixels différents (|a−b| > 32), écart maximal
  planche(paires, sortie, titre) → image côte à côte « référence | ma page | superposition » (cyan = référence seule,
                                   rouge = ma page seule, noir = commun)
Ligne de commande (deux images, une zone) :
  python3 comparaison.py A.png B.png portrait x0 y0 x1 y1 [sortie.png]
"""
import os, sys
from PIL import Image, ImageDraw, ImageFont, ImageChops

FORMATS = {'portrait': (595.276, 841.89), 'paysage': (841.89, 595.276)}
ICI = os.path.dirname(os.path.abspath(__file__))
POLICE = os.path.join(os.path.dirname(ICI), 'res', 'AKKU_REGULAR.ttf')

class Page:
    def __init__(self, chemin, orientation=None):
        self.chemin = chemin
        self.im = Image.open(chemin).convert('L')
        W, H = self.im.size
        self.orientation = orientation or ('paysage' if W > H else 'portrait')
        self.pw, self.ph = FORMATS[self.orientation]
        self.sx, self.sy = W / self.pw, H / self.ph
    def px(self, zone):
        x0, y0, x1, y1 = zone
        return (max(0, int(round(x0 * self.sx))), max(0, int(round((self.ph - y1) * self.sy))),
                min(self.im.size[0], int(round(x1 * self.sx))), min(self.im.size[1], int(round((self.ph - y0) * self.sy))))
    def decoupe(self, zone):
        return self.im.crop(self.px(zone))
    def encre(self, zone, seuil=200):
        X0, Y0, X1, Y1 = self.px(zone)
        c = self.im.crop((X0, Y0, X1, Y1)).point(lambda v: 255 if v < seuil else 0)
        bb = c.getbbox()
        if not bb: return None
        g, h, d, b = bb
        return (round((X0 + g) / self.sx, 2), round(self.ph - (Y0 + b) / self.sy, 2),
                round((X0 + d) / self.sx, 2), round(self.ph - (Y0 + h) / self.sy, 2))

def ecarts(a, b, zone, seuil=200):
    ea, eb = a.encre(zone, seuil), b.encre(zone, seuil)
    r = {'ref': ea, 'mien': eb}
    if ea and eb:
        r['dg'] = round(eb[0] - ea[0], 2); r['db'] = round(eb[1] - ea[1], 2)
        r['dd'] = round(eb[2] - ea[2], 2); r['dh'] = round(eb[3] - ea[3], 2)
        r['max'] = max(abs(r['dg']), abs(r['db']), abs(r['dd']), abs(r['dh']))
    ca, cb = a.decoupe(zone), b.decoupe(zone)
    if ca.size != cb.size:
        cb = cb.resize(ca.size)
    diff = ImageChops.difference(ca, cb)
    hist = diff.histogram()
    r['pixels_diff'] = sum(hist[33:])
    r['pixels_encre'] = sum(1 for v in ca.getdata() if v < seuil)
    r['diff_max'] = max(i for i, n in enumerate(hist) if n) if any(hist) else 0
    return r

def superposition(ca, cb):
    """cyan = encre de la référence seule, rouge = encre de ma page seule, noir = commun"""
    if ca.size != cb.size: cb = cb.resize(ca.size)
    return Image.merge('RGB', (ca, cb, cb))

def _police(t):
    try: return ImageFont.truetype(POLICE, t)
    except Exception: return ImageFont.load_default()

def planche(lignes, sortie, titre='', agrandir=1):
    """lignes = [(libellé, image_ref (L), image_mienne (L)), …] → une planche : référence | ma page | superposition"""
    f, ft = _police(16), _police(20)
    blocs = []
    for lib, ca, cb in lignes:
        if agrandir != 1:
            ca = ca.resize((ca.size[0] * agrandir, ca.size[1] * agrandir), Image.NEAREST)
            cb = cb.resize((cb.size[0] * agrandir, cb.size[1] * agrandir), Image.NEAREST)
        sp = superposition(ca, cb)
        w, h = ca.size
        bl = Image.new('RGB', (3 * w + 40, h + 30), 'white')
        d = ImageDraw.Draw(bl)
        for i, (im, t) in enumerate(((ca.convert('RGB'), 'référence'), (cb.convert('RGB'), 'ma page'), (sp, 'superposition'))):
            x = i * (w + 20)
            bl.paste(im, (x, 26)); d.rectangle([x, 26, x + w - 1, 26 + h - 1], outline=(200, 200, 200))
            d.text((x, 4), lib + ' — ' + t if i == 0 else t, fill=(0, 0, 0), font=f)
        blocs.append(bl)
    W = max(b.size[0] for b in blocs) + 20
    H = sum(b.size[1] + 16 for b in blocs) + 44
    out = Image.new('RGB', (W, H), 'white')
    d = ImageDraw.Draw(out); d.text((10, 10), titre, fill=(0, 0, 0), font=ft)
    y = 44
    for b in blocs:
        out.paste(b, (10, y)); y += b.size[1] + 16
    out.save(sortie)
    return sortie

if __name__ == '__main__':
    if len(sys.argv) < 8:
        print(__doc__); sys.exit(2)
    A, B, ori = Page(sys.argv[1], sys.argv[3]), Page(sys.argv[2], sys.argv[3]), sys.argv[3]
    z = tuple(float(v) for v in sys.argv[4:8])
    print(ecarts(A, B, z))
    if len(sys.argv) > 8:
        planche([('zone', A.decoupe(z), B.decoupe(z))], sys.argv[8], os.path.basename(sys.argv[1]) + ' | ' + os.path.basename(sys.argv[2]))
