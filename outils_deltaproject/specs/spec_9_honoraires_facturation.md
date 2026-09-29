# Cahier des charges : DeltaSub ▸ HONORAIRES et FACTURATION (reproduction de Deltaproject)

Modules visés : **DELTAhonorar** (domaines d'affaire « Calcul des honoraires », « Contrats honoraires », « Avancement des prestations ») et **DELTAfaktura** (domaine d'affaire « Factures », menu FACTURES ▸ « Contrôle de factures », encaissements, QR-facture).

- **Sources** : bytecode de `/Applications/DELTAproject.app` (javap, `db.jar`, `app.jar`, `doc.jar`, classes `deltaproject.*`), libellés FR de `Strings.db`, CSV et `schema.txt` de la base du bureau, `modeles.json`, manuels FR (v14) et DE (v15+). À cela s'ajoutent 8 rapports d'analyse confrontés entre eux (annexe A).
- **Contre-vérifications faites pour ce cahier** : `…/scratchpad/research/hf_critique/` (`bgrep.py`, `verif_fact.py`, `db.Integrity.txt`, `db.Cleanup.txt`).
- **État de DeltaSub pris pour référence** : `DeltaSub.html` au commit `ee71f56` (« module Management complet »), 4 276 lignes. Les numéros de ligne cités sont ceux de ce commit.
- **Légende** : **[P]** prouvé (bytecode `Classe.méthode@offset`, libellé, donnée ou page) · **[D]** déduit.
- **Règle absolue** : tout se fait dans `DeltaSub.html` et `serveur_deltasub.py`, avec le modèle de données de Deltaproject. On ne fusionne jamais avec `Facturation.html`, on ne lui renvoie pas, on ne lit pas son `localStorage` (`sa_*`) et on ne reprend ni son code ni ses données.

---

## 0. Synthèse et décisions

### 0.1 Ce qu'il faut savoir avant de coder

1. **Le bureau n'a jamais eu ces licences** [P]. Dans `APP.APPLICENCE`, les codes présents sont 1, 10, 100, 101 et 103 ; DELTAhonorar (13) et DELTAfaktura (11) manquent. Aucun rôle ne contient les droits 14,x (honoraires) ni 12,0 (menu FACTURES).
   - Seul « Contrats honoraires » était visible, en mode réduit (droit `projectContracts` 4,17 du rôle « Standard »).
   - DeltaSub n'importe ni licences ni droits (`SKIP_TABLES`) : **tous les modules seront visibles pour tous**, en mode complet.
2. **Données réelles** [P] :
   - 1 contrat (ID 501, affaire 915), son « calcul de base » (`PROJECTFEECALCULATION` 501, sans `PROJECTFEE`) et 2 lignes de conditions (501 frais, 502 honoraires) ;
   - 27 positions de gabarits (`INVOICEPOS`) dans 5 groupes ;
   - 1 514 lignes `TIMELOG` marquées « Facturé » (3 dates, 4 lots) ;
   - tout le reste vaut 0 ligne : factures, positions, encaissements, planifications, QR, en-têtes de calcul, avancement.
   - Les tables vides **n'existent pas** comme collections dans DeltaSub (pas de CSV extrait). Le premier `DS.save` les crée, et `/api/ids` démarre à 1.
3. **Le texte provisoire de DeltaSub viole la règle** : `DeltaSub.html` l.1547-1548 (`const why`) renvoie « à l'app Facturation » pour les 4 domaines. Il est aussi repris dans `spec_management.md` (l.51, §6 et §8). **Il faut le supprimer** et le remplacer par les vrais domaines.
4. **Aucun automatisme caché dans l'original** [P] :
   - pas de numérotation des factures ;
   - pas de génération de factures depuis les planifications ;
   - pas de déduction automatique des acomptes ;
   - pas d'échéance calculée ;
   - pas de verrouillage par statut ;
   - pas de rappel automatique ;
   - pas de lien direct heures ↔ facture : seulement `ISCHARGED` et `CHARGEDDATE`.
5. **Trois moteurs de calcul sont prouvés au centime** et doivent être codés une fois pour toutes (§4.5, §4.6, §6.6) :
   - l'arrondi symétrique DELTA ;
   - la cascade des conditions (HT → rabais → escompte → arrondi → TVA → TTC) ;
   - l'algorithme des 8 genres de positions de facture.

### 0.2 Lots (détail §11)

| Lot | Contenu | Dépend de |
|---|---|---|
| **0** | Socle : collections, `dpRound`, conditions, `invCalc`, TVA par défaut, intégrité, suppression des renvois `why` | — |
| **1** | Contrats honoraires + « Editer les conditions » + Planifier les encaissements + Encaissements du contrat | 0 |
| **2** | Calcul des honoraires : 2a en-têtes/variantes/Global-Forfaitaire-Autre ; 2b Coût de l'ouvrage (SIA, CFC, devis) ; 2c Temps effectif, frais, services supplémentaires, transferts ; « Nouveau contrat basé sur un calcul » | 0, 1 |
| **3** | Avancement des prestations | 0 |
| **4** | Factures d'affaire : positions, gabarits (Administrateur), encaissement depuis la facture, impression | 0, 1 |
| **5** | FACTURES ▸ Contrôle de factures + Controlling ▸ « Transférer en facturation » | 4 |
| **6** | QR-facture : comptes, éditeur, validation, encodeur QR, rendu, sortie | 4 |
| **7** | Documents et PDF stockés par objet (serveur), `.dpdoc` jeux 1/2, anciens documents, import des positions depuis le calcul, vues Management liées | 2, 4, 6 |

L'utilisateur a demandé « le module honoraire » : les lots 1 à 3 (DELTAhonorar et contrats) passent donc avant la facturation (lots 4 à 6).

---

## 1. Périmètre, licences et visibilité

### 1.1 Éléments reproduits

| Élément | Emplacement Deltaproject | Condition d'origine [P] | Vu au bureau | DeltaSub |
|---|---|---|---|---|
| « Calcul des honoraires » (libellé installé : « Offres d'honoraires », `MenuTableModel.fees`) | AFFAIRES ▸ affaire ▸ domaine | licence DELTAhonorar + droit `honorarFeeCalculation` 14,0 (`ProjectFrame.setMenuTable@174-193`) | non | domaine existant dans `DOMAINS` (l.1460) |
| « Contrats honoraires » | domaine | droit `projectContracts` 4,17 seul (@199-209). Le mode complet (menus ▾ de + et ✎, planification, encaissements) exige DELTAhonorar + 14,0 (`ProjectContractFrame.<clinit>`) | oui, en mode réduit | domaine existant, **mode complet d'office** |
| « Avancement des prestations » | domaine | DELTAhonorar + `honorarImplementation` 14,1 (@256-275) | non | domaine existant |
| « Factures » | domaine | **licence DELTAfaktura seule** (@281-291). Le droit `projectInvoices` 4,15 existe mais **n'est testé nulle part** (bgrep : seule `Rights$Right` le référence) | non | domaine existant |
| FACTURES ▸ « Contrôle de factures » | menu principal, entre TÂCHES et BÂTIMENT (`Modules$Menu.invoices` ordinal 6) | droit `invoices` 12,0 + module DELTAfaktura ; aucun contrôle de droit dans les écrans | non | **à ajouter dans `NAV`** |
| Administrateur ▸ « Gabarits de facturation » | catégorie admin | droit `adminProjects` | oui (admin) | **à ajouter** |
| Administrateur ▸ « Comptes pour QR-facture » | catégorie admin (15ᵉ sur 21) | droit `adminQRBillAccounts` 1,9 | oui (admin) | **à ajouter** |
| Controlling ▸ « Modifier le statut "Facturé" et transférer en facturation » | Heures et Frais | DELTAcontrol ; transfert = choix d'une facture | oui (1 titulaire) | marquage déjà présent (`ctlFlag`, l.1636) ; **transfert à ajouter** |

### 1.2 Hors périmètre (cités seulement)

- **MANAGEMENT ▸ Contrats honoraires** (7 catégories : Contrats, Contrats et sous-traitants, Echéancier d'encaissements, Encaissements planifiés, Encaissements reçus, Situation des encaissements, Avancement des prestations).
- **MANAGEMENT ▸ Factures** (6 catégories) et **Analyse de factures**.
- Ces vues relèvent de `spec_management.md`. Leurs §6 et §8 disent « ne pas construire, géré dans Facturation.html » : **à réviser** une fois les lots 1 et 4 livrés. Elles liront alors les collections décrites ici.
- **Planification RH** (DELTAplanning) : l'avancement par phase partielle en francs (`PLANNINGMONTH.IMPLEMENTATIONRATE`) n'appartient pas à DELTAhonorar.
- **`INVOICECONDITION*`** (« Groupes de conditions ») : n'est utilisé **que** par DELTAbauad (devis, soumission, contrôle des coûts) [P, recherche dans tous les jars]. Il ne sert pas aux factures d'honoraires et se range avec le Bâtiment.

### 1.3 Ordre des domaines

- **Original** [P, `setMenuTable`] : … Frais, **Offres d'honoraires**, **Contrats honoraires**, (Planification RH, Analyse de planification RH), **Avancement des prestations**, **Factures**, Liste des plans…
- DeltaSub (`DOMAINS`, l.1460) respecte déjà cet ordre, sans les deux domaines DELTAplanning.
- **Choix recommandé** : garder le libellé « Calcul des honoraires » (manuel et DeltaSub actuel) ; voir §13.

---

## 2. Modèle de données

### 2.1 Collections (noms en minuscules, champs en MAJUSCULES comme les colonnes Derby)

| Collection | Lignes au bureau | Déjà dans DeltaSub | Rôle |
|---|---|---|---|
| `projectfee` | 0 | non | en-tête d'un calcul d'honoraires |
| `projectfeecalculation` | 1 | oui | variante, ou « calcul de base » d'un contrat |
| `projectfeecalculationamount` | 2 | oui | conditions (honoraires ou frais) |
| `projectfeetimeitem` / `projectfeecostitem` / `projectfeeadditionalitem` | 0 / 0 / 0 | non | lignes : temps, frais, services supplémentaires |
| `projectcontract` | 1 | oui | contrat d'honoraires |
| `projectscheduledpayment` | 0 | non | encaissements planifiés |
| `projectpayment` | 0 | non | encaissements reçus |
| `projectinvoice` / `projectinvoicepos` | 0 / 0 | non | factures et positions |
| `qrbill` / `qrbillaccount` | 0 / 0 | non | QR-facture et comptes créanciers |
| `projectimplementation` | 0 | non | avancement des prestations |
| `invoiceposgroup` / `invoicepos` | 5 / 27 | oui | gabarits de facturation |
| `setting` | 28 | oui | `genVatRatePos` (ID 55) = **8.1**, `mainCurrency` (651) = CHF, `isModuleFormVisible` (801) = [YES] |

Format des données [P, import] : dates « AAAA-MM-JJ », booléens 0/1, montants en `double`.

**Enregistrements liés : toujours en un seul `DS.commit(ops)`** avec `DS.newIds(t,n)`. C'est le cas pour :
- contrat + calcul de base + 2 conditions ;
- facture + positions + encaissement + QR.

### 2.2 Colonnes, types et valeurs par défaut [P : `schema.txt`, constructeurs `db.*`]

**PROJECTFEE**
- `NUMBER` vc255 (UI 128) : défaut = nombre d'en-têtes de l'affaire + 1.
- `NAME` vc255 (UI 128), obligatoire.
- `BILLINGCATEGORYCODE` int, choisi à la création puis figé.
- `BASEDONCODE` int (§2.3).
- `CHANGEDDATE` date : défaut aujourd'hui.
- `ISSUBCONTRACT` sint : défaut 0.
- `SUPPLIERDESC` vc255 (UI 128).
- `USERID` vc32 : défaut l'utilisateur courant.
- `VERSION` vc1024 (libellé « Statut »).
- `REMARK` vc1024.
- `DOCUMENTLOCK_ID` : non repris, le 409 de DeltaSub en tient lieu.
- `PROJECT_ID`, `SUBPROJECT_ID`, `CONTACT_ID` (Mandant), `SUPPLIERCONTACT_ID` (Mandataire).

**PROJECTFEECALCULATION**
- `NUMBER` : défaut = nombre de variantes de l'en-tête + 1.
- `TITLE` (« Type de document »), obligatoire. `NAME`, obligatoire.
- `CHANGEDDATE` : défaut aujourd'hui. `VERSION` (« Statut »), `REMARK`.
- `TIMEHOUR`, `TIMEAMOUNTPART1..3`, `TIMEHOURPART1..3` (dbl, défaut 0).
- `CALCULATIONDETAILS` clob (JSON §2.4, null tant que le dialogue SIA n'a pas été ouvert).
- `PROJECTFEE_ID` (**null = calcul de base**, `isBasicCalculation()`).
- `TIMECALCULATIONAMOUNT_ID`, `COSTCALCULATIONAMOUNT_ID` : 2 lignes de conditions créées vides.
- Aucun `PROJECT_ID` : l'affaire se déduit de `PROJECTFEE.PROJECT_ID` ou du contrat.

**PROJECTFEECALCULATIONAMOUNT**

| Colonne | Défaut | Sens |
|---|---|---|
| `AMOUNT1` | 0 | brut HT |
| `SALESDISCOUNT` | 0 | rabais, % **signé** (−2 = rabais de 2 %) |
| `CASHDISCOUNT` | 0 | escompte, % signé |
| `ROUNDING` | 0 | arrondi (montant) |
| `ISMERCANTILEROUNDING` | 0 | arrondi à 5 ct |
| `VATRATE` | **−1** | < 0 = taux par défaut `genVatRatePos` |
| `AMOUNT2` | 0 | net TTC |

**PROJECTFEETIMEITEM**
- `ACTIVITY_ID` obligatoire, `SUBPHASE_ID`, `TIMEHOUR`, `RATE`, `FACTOR` (défaut 1), `ISOPTIONAL`, `REMARK` vc1024, `SORTORDER`, `PROJECTFEETIMECALC_ID`.
- Montant = h × tarif × facteur. Aucun tarif pré-rempli.

**PROJECTFEEADDITIONALITEM**
- Mêmes colonnes, sans activité ; `SUBPHASE_ID` **obligatoire** ; `PROJECTFEEADDITIONALCALC_ID`.

**PROJECTFEECOSTITEM**
- `COSTCATEGORY_ID` obligatoire, `SUBPHASE_ID`, `QUANTITY`, `UNITPRICE`, `FACTOR` (1), `ISOPTIONAL`, `REMARK`, `SORTORDER`, `PROJECTFEECOSTCALC_ID`.
- Montant = quantité × prix × facteur. Le prix du genre de frais **n'est pas repris**, seule son unité s'affiche.
- Une ligne `ISOPTIONAL = 1` est **exclue de toutes les sommes** (vrai pour les trois tables).

**PROJECTCONTRACT**

| Colonne | Détail |
|---|---|
| `NUMBER` | UI 64 ; défaut = nombre de contrats + 1 |
| `NAME` | UI 64, obligatoire |
| `CONTRACTDATE` | défaut aujourd'hui |
| `SORTORDER` | n + 1, renuméroté de 1 à n |
| `SUPPLIERDESC` | UI 128 |
| `ISSUBCONTRACT` | 0 « Maître d'ouvrage » / 1 « Sous-traitant » |
| `USERID` | défaut l'utilisateur courant |
| `STATECODE` | 0 |
| `REMARK` | 1024 |
| `CONTRACTFOLDER` | 1024, chemin |
| `TIMEAMOUNT1/2`, `TIMEHOUR`, `COSTAMOUNT1/2` | **copies** : les getters lisent les conditions du calcul lié s'il existe |
| `CONTRACTAMOUNT` | **stocké seulement** |
| `ISINVOICEABLE` | ☑ « Contrat accessible », **défaut 0** |
| `CONTACT_ID` (Mandant) et `SUPPLIERCONTACT_ID` (Mandataire) | obligatoires |
| `SUBPROJECT_ID` | ouvrage |
| `PROJECTFEECALCULATION_ID` | toujours renseigné (calcul de base créé au besoin) |

**PROJECTSCHEDULEDPAYMENT** : `NAME` (UI 64), `INVOICEDATE`, `DUEDATE`, `PAYMENTDATE`, `AMOUNT`, `REMARK` 1024, `SORTORDER`, `PROJECTCONTRACT_ID`, `PHASE_ID` → `projectphase`, `SUBPHASE_ID` → `projectsubphase`.

**PROJECTPAYMENT**
- Colonnes : `NAME` (UI 64), `INVOICEDATE`, `PAYMENTDATE`, `AMOUNT`, `REMARK` 1024, `SORTORDER`, `PROJECTCONTRACT_ID`, `PROJECTINVOICE_ID`.
- Cadenas (`isLockedByInvoice`) = `PROJECTINVOICE_ID` non nul.

**PROJECTINVOICE**
- `NUMBER` vc255 (UI 64), texte libre non obligatoire.
- `NAME` (UI 255), obligatoire.
- `ACCOUNTINGPERIOD` (UI 64).
- `INVOICEDATE` : défaut aujourd'hui. `DUEDATE` : null.
- `PROJECTINVOICESTATECODE` : défaut 0.
- `TERMSOFPAYMENT` : texte libre.
- `AMOUNT` (TTC, stocké) : 0. `AMOUNTPAID` : 0. `PAYMENTDATE`.
- `DUNNINGLEVEL` int. `NOTE` (UI 255).
- `TEMPLATEPROPERTIES` vc255 : réglages de l'ancien document, valeurs séparées par « ; ».
- `PROJECT_ID`, `PROJECTCONTRACT_ID`, `CONTACT_ID` (Débiteur, obligatoire), `PROJECTPAYMENT_ID`, `QRBILL_ID`.

**PROJECTINVOICEPOS** : `PROJECTINVOICE_ID`, `SORTORDER`, `TYPECODE` (défaut 1), `NAME` (UI 255), `QUANTITY` (1), `UNIT`, `PRICE` (0), `AMOUNT` (0), `ISVISIBLE` (1).

**QRBILL**
- `CREDITORACCOUNT`, `CREDITORNAME`, `CREDITORSTREET`, `CREDITORHOUSENO`, `CREDITORPOSTALCODE`, `CREDITORLOCATION`, `CREDITORCOUNTRYCODE`.
- `CURRENCY` (défaut « CHF »), `AMOUNT` (0), `REFERENCE`, `UNSTRUCTUREDMESSAGE`, `BILLINFORMATION`.
- `DEBTORNAME`, `DEBTORSTREET`, `DEBTORHOUSENO`, `DEBTORPOSTALCODE`, `DEBTORLOCATION`, `DEBTORCOUNTRYCODE`.
- **Aucune clé vers `QRBILLACCOUNT`** : le compte est recopié.

**QRBILLACCOUNT** : `ACCOUNTNAME` (128), `ACCOUNT` (IBAN, 34), `NAME` (128), `STREET` (128), `HOUSENO` (16), `POSTALCODE` (16), `LOCATION` (128), `COUNTRYCODE` (2, défaut « CH »).

**PROJECTIMPLEMENTATION**
- `PROJECT_ID` (pas de phase ni de contrat), `IMPLEMENTATIONDATE` (défaut aujourd'hui), `NAME` (UI 64).
- `SCHEDULEDVALUE` et `CURRENTVALUE` : int, **−1 = vide**.
- `SCHEDULEDUSERID`, `SCHEDULEDREMARK` (1024), `CURRENTUSERID`, `CURRENTREMARK` (1024).

**Catalogues**
- `INVOICEPOSGROUP` : `NAMEGE/FR/IT/EN`, `SORTORDER`.
- `INVOICEPOS` : `NAMEGE/FR/IT/EN`, `SORTORDER`, `TYPECODE`, `QUANTITY`, `UNIT`, `PRICE`, `ISVISIBLE`, `INVOICEPOSGROUP_ID`.

**Liens avec les heures et les frais** [P, schéma]
- `TIMELOG` et `PROJECTCOST` n'ont **aucune clé vers une facture**. Seuls `ISCHARGEABLE`, `ISCHARGED` et `CHARGEDDATE` existent.
- Supprimer une facture ne « défacture » donc rien.

### 2.3 Énumérations [P]

| Champ | Valeurs |
|---|---|
| `PROJECTINVOICESTATECODE` | 0 « Planifiée », 1 « Envoyée », 2 « Rappel envoyé », 3 « Payée » |
| `PROJECTINVOICEPOS.TYPECODE` (`InvoicePos$Type`) | 0 Groupe, 1 Position, 2 Sous-total, 3 « % (Dernier montant) », 4 « % TVA (Dernier montant) », 5 « % TVA incl. (Dernier montant) », 6 Total, 7 Commentaire (3 à 5 : prix en %) |
| `PROJECTCONTRACT.STATECODE` | 0 « En traitement », 1 « Validé », 2 « Refusé » |
| `ISSUBCONTRACT` | 0 « Maître d'ouvrage », 1 « Sous-traitant » |
| `BILLINGCATEGORYCODE` | 1 Global, 2 Forfaitaire, 3 « Coût de l'ouvrage », 4 « Temps employé effectif », 5 Autre |
| `BASEDONCODE` | 11/12/13 SIA 1001/1-3, 20 SIA 1002, 30 1003, 40 1004, 50 1005, 60 1006, 80 1008, 111-114 SIA 1011/1-4, 121-123 SIA 1012/1-3, **1012/4 = 121 (bogue d'origine)**, 0 Autre. Libellés FR exacts : `Strings.db`, `db|ProjectFee|SIA_*` (ex. « SIA 1002 Contrat relatif aux prestations de l'architecte ») |
| `PROJECT.PROJECTSTATECODE` | 1 Configuration, 2 En cours, 3 En attente, 4 Terminée, 5 Archivée (`PSTATE`, l.1108) |
| Unités (`rsrc.Lists unit0..20`) | h, j, ms, se, gl, f, p, m, m2, m3, su, br, up, pa, ro, sa, hl, kJ, kg, l, t (défaut « h ») |

### 2.4 `CALCULATIONDETAILS` : format JSON exact [P, `ProjectFeeCalculationFactors.write/read`]

```json
[ {"V":1,"B":1000000.0,"Z1":0.062,"Z2":10.58,"P":0.1678,"Q":100.0,"R":1.0,"N":1.0,"U":1.0,"Tm":1678.0,"Rate":100.0},
  [ {"N":"0","T":"Terrain","A":0.0,"Bkp":[{"N":"00","T":"Etudes préliminaires","A":0.0}]} ],
  [ {"Nu":3,"Na":"Etude du projet","Sub":[{"Nu":31,"Na":"Avant-projet","P":9.0,"I":1.0,"Rate":135.0,"S":1.0}]} ] ]
```

**Défauts** : B = 0, Q = 100, R = N = U = 1 ; les autres à 0.

**Initialisation**, faite une seule fois, quand le champ est null :
- **CFC** : catalogue standard (au bureau `CATALOG` 101). Un code à 1 caractère donne un groupe principal, un code à 2 caractères une position de ce groupe.
- **Phases** : seules les `projectphase` dont le numéro est > 2 et < 6 (donc 3, 4, 5) sont reprises, avec leurs phases partielles.
- **Parts par défaut** : 31 = 9, 32 = 21, 33 = 2.5, 41 = 18, 51 = 16, 52 = 29, 53 = 4.5, autres = 0. Facteurs I = S = 1, tarif 0.
- **Instantané** : la liste des phases n'est jamais réactualisée.

### 2.5 Relations et cascades [P]

```
PROJECT ─1:n→ PROJECTFEE ─1:n→ PROJECTFEECALCULATION ─→ 2 × PROJECTFEECALCULATIONAMOUNT (time, cost)
                                     ├─1:n→ PROJECTFEETIMEITEM / PROJECTFEEADDITIONALITEM / PROJECTFEECOSTITEM
PROJECT ─1:n→ PROJECTCONTRACT ─1:1→ PROJECTFEECALCULATION (vraie variante OU calcul de base)
                 ├─1:n→ PROJECTSCHEDULEDPAYMENT (cascade)       (PHASE_ID, SUBPHASE_ID)
                 ├─1:n→ PROJECTPAYMENT (cascade) ←─1:1─ PROJECTINVOICE.PROJECTPAYMENT_ID  (double lien, cadenas)
                 └─1:n→ PROJECTINVOICE.PROJECTCONTRACT_ID
PROJECT ─1:n→ PROJECTINVOICE (cascade, OrderBy invoiceDate) ─1:n→ PROJECTINVOICEPOS (cascade, OrderBy sortOrder)
                                                             └─1:1→ QRBILL (cascade)
PROJECT ─1:n→ PROJECTIMPLEMENTATION (OrderBy implementationDate)
```

- La planification n'a **aucune clé** vers la facture : ses valeurs sont recopiées.
- `PLANNINGSUBPROJECT.PROJECTCONTRACT_ID` (DELTAplanning) bloque la suppression d'un contrat.

### 2.6 Règles d'intégrité [P : `db.Integrity`] et points d'ancrage DeltaSub

| Objet supprimé | Refusé si | Ancrage DeltaSub à compléter |
|---|---|---|
| Adresse `CONTACT` | débiteur d'une facture, mandant d'un contrat (`countByContact` : mandant seulement), contact d'un en-tête de calcul | `delContact` l.809 et `delOwner` l.795 : ajouter `projectinvoice.CONTACT_ID`, `projectcontract.CONTACT_ID`, `projectfee.CONTACT_ID` et `SUPPLIERCONTACT_ID` [D pour ce dernier] |
| Ouvrage `SUBPROJECT` | référencé par un en-tête de calcul ou un contrat | suppression d'ouvrage |
| Phase / phase partielle | référencée par `projectscheduledpayment` (`PHASE_ID`, `SUBPHASE_ID`) ou par une ligne de calcul (temps, services supplémentaires, frais) | `cfgPhases` l.1197 (test actuel limité aux heures) |
| Activité | `projectfeetimeitem.ACTIVITY_ID` | `cfgActivities` l.1228 |
| Genre de frais | `projectfeecostitem.COSTCATEGORY_ID` | suppression d'un genre de frais |
| Variante de calcul | un contrat la référence : « Cette inscription ne peut pas être supprimée car elle est toujours utilisée dans un contrat. » | — |
| En-tête de calcul | il a des variantes : « Suppression impossible, car il y a un calcul lié. » | — |
| Contrat | factures liées ou planification RH (`isProjectContractDeletable`) | — |
| Affaire | **ni factures ni contrats ne bloquent** : ils partent en cascade | `delProject` l.1176 : ajouter la cascade de toutes les collections ci-dessus |

### 2.7 Catalogues du bureau [P, CSV]

**`INVOICEPOSGROUP` / `INVOICEPOS`** (ID ; T = TYPECODE)

| Groupe | Positions |
|---|---|
| 1 « Facturation en régie » | Régie (T0) ; 9 fonctions en T1 à prix 0 (Directeur général des travaux, Architecte, Directeur des travaux, Technicien, Personnel dirigeant de l'affaire, Dessinateur, Adjoint au directeur des travaux, Secrétariat, Personnel auxiliaire) ; Sous-total régie (T2) |
| 51 « Facturation des frais » | Frais (T0) ; Frais de transport, Frais bureau de chantier, Frais de copie, Frais de documentation (T1) ; Sous-total frais (T2) |
| 52 « Facturation des honoraires » | 77 Honoraires (T0) ; 78 Honoraires (T1, Q 1) ; 79 Sous-total honoraires (T2) |
| 102 « HT/conditions/TVA/TTC » | 82 Total brut HT (T6) ; 83 Rabais (T3, prix 0) ; 84 Sous-total HT (T6) ; **85 TVA (T4, 7.7)** ; 86 TOTAL TTC (T6) |
| 101 « TTC (TVA incluse) » | 80 TOTAL TTC (T6) ; **81 TVA inclusive (T5, 7.7)** |

- Les lignes 81 et 85 sont encore à **7.7** : proposer à Paulo de les passer à 8.1. Ne pas corriger sans accord.
- `RATE` : 11 niveaux (Architecte 135, Directeur des travaux 155…).
- ⚠ Seules 6 activités sur 390 ont un `PROJECTRATEGROUP_ID` : les montants tirés des heures valent souvent 0.

### 2.8 Préférences par utilisateur (original : `app.Preferences`, module `invoice`/`project`) → `localStorage`, clés `ds_*`, lecture et écriture en try/catch

| Original | DeltaSub | Usage |
|---|---|---|
| `ProjectInvoice.isMercantileRounding` (0/1, défaut 0) | `ds_inv_round` | case « Arrondir » des positions, **non stockée dans la facture** |
| `lastProjectInvoiceMenuSelection` | `ds_inv_cat` | catégorie du Contrôle de factures |
| `projectInvoiceListRowSorter`, `projectInvoiceFrame.Preferences`, `projectInvoiceStateFrame.Preferences`, `projectContractFrame.Preferences`, `projectImplementationFrame.Preferences`, `projectFeeFrame.FeeRowSorter` | `ds_inv_sort`, `ds_split_*` | tri et positions des séparateurs |
| `qrbill.Language / OutputSize / SeparatorLine / SavePdf / GeneratedPdf / OpenFile` | `ds_qr_*` | dialogue « Créer une QR-facture » |

---

## 3. Contrats honoraires (`ProjectContractFrame`, `ProjectContractDialog`)

### 3.1 Disposition [P]

Zone de droite en trois parties verticales (hauteurs mémorisées) :
1. le tableau des contrats (séparateur à 500 px) ;
2. le panneau Documents (250 px ; en DeltaSub V1, voir §10.5) ;
3. le **panneau de synthèse** `ProjectContractInfoPanel` (§3.4), **partagé avec le domaine Factures**.

### 3.2 Barre et souris [P]

| Bouton | Action | Actif si |
|---|---|---|
| **+ ▾** | « Nouveau contrat… », « Nouveau contrat basé sur un calcul… » | une affaire |
| **✎ ▾** | « Editer le contrat… », « Planifier des encaissements… », « Editer les encaissements… » | 1 ligne |
| **−** | suppression (§3.6) | 1 ligne |
| **⇈ ↑ ↓ ⇊** | ordre manuel | ⇈ ↑ si la ligne n'est pas la première ; ↓ ⇊ si ce n'est pas la dernière |
| **📄 ▾** | « Afficher le rapport… [Ancien document] » | 1 ligne ; visible car `isModuleFormVisible = [YES]` |

- Double-clic = éditer ; **Maj + double-clic** = planifier ; clic droit = menu ✎.
- Il n'y a **ni tri par en-tête, ni recherche, ni export** (`Tables.initTable(…, false)`).

### 3.3 Colonnes (`ProjectContractTableModel`, type `all` = `111111111111`) [P]

| N° | Colonne | Remarque |
|---|---|---|
| 0 | Numéro | 80 px fixes |
| 1 | Désignation | |
| 2 | Date | 100 px fixes |
| 3 | Mandant | `contactName` |
| 4 | Mandataire | |
| 5 | Type de prestations | |
| 6 | Contrat avec | |
| 7 | Ouvrage | |
| 8 | Utilisateur | |
| 9 | Statut | |
| 10 | Total | `CONTRACTAMOUNT` |
| 11 | *(sans titre)* | monnaie de l'affaire |

Tri par `SORTORDER`. Le type `browser` (« Choix du contrat ») affiche les colonnes 0 à 5.

### 3.4 Panneau de synthèse (`ProjectContractInfoPanel`) [P]

Trois colonnes en lecture seule ; les montants sont suivis de la monnaie de l'affaire.

1. « Contrat » (`NUMBER + " " + NAME`), « Date du contrat », « Entité » ⓘ (mandant), « Mandataire » ⓘ, « Type de prestations », « Ouvrage ».
2. **« Prestations convenues »** : « Honoraires bruts/HT », « Honoraires nets/TTC » ⓘ, « Coûts supplémentaires bruts/HT », « Coûts supplémentaires nets/TTC » ⓘ, « Montant du contrat TTC » (`CONTRACTAMOUNT`). Les ⓘ ouvrent les conditions en lecture seule.
3. **« Encaissements »** :
   - « Encaissements planifiés » = Σ `projectscheduledpayment.AMOUNT` du contrat ;
   - « Facturé » = Σ `projectinvoice.AMOUNT` du contrat, **tous statuts** ;
   - « Encaissements » = Σ `projectpayment.AMOUNT` du contrat (et **non** Σ `AMOUNTPAID`).

Lecture des montants [P, getters] :
```js
ctrTime1 = c => { const f=DS.get('projectfeecalculation',c.PROJECTFEECALCULATION_ID); const a=f&&DS.get('projectfeecalculationamount',f.TIMECALCULATIONAMOUNT_ID); return a?a.AMOUNT1:c.TIMEAMOUNT1; }
// idem ctrTime2 (AMOUNT2), ctrCost1/2 (COSTCALCULATIONAMOUNT_ID), ctrHour (f.TIMEHOUR) ; CONTRACTAMOUNT toujours la colonne
ctrVat = c => vat(timeAmt)+vat(costAmt)      // 0 sans calcul ;   ctrHT = c.CONTRACTAMOUNT − ctrVat(c)
```

### 3.5 Dialogue « Nouveau contrat » / « Editer le contrat » [P]

| Libellé | Contrôle et règles |
|---|---|
| **Numéro** | 64 car., obligatoire |
| **Désignation** | 64, obligatoire |
| Type de prestations ◀ | 128. Suggestions : « Prestations de l'architecte », « …de l'ingénieur civil », « …de l'ingénieur forestier », « …de l'architecte paysagiste », « Prestations du géologue », « …de l'ingénieur », « …de l'ingénieur électricien », « …de l'ingénieur acousticien », « Prestations garantie des coûts » |
| Date 📅 | non éditable au clavier |
| **Mandant** ◀ ⓘ | ◀ = « Choisir… » (Navigateur d'adresses, sélection simple, réutiliser `pickContact` l.950) / « Supprimer » ; obligatoire |
| **Mandataire** ◀ ⓘ | idem, obligatoire |
| Contrat avec | ◉ Maître d'ouvrage / ○ Sous-traitant |
| Ouvrage | ligne vide + ouvrages de l'affaire |
| Utilisateur ◀ | non éditable |
| Statut | liste 0/1/2, sans transition imposée ni verrouillage |
| Remarque | 1024 |
| Emplacement du dossier d'affaire ◀ | « Choisir… » ; « Supprimer » et « Afficher l'emplacement » si rempli. En DeltaSub : saisie ou collage du chemin, bouton copier [D] |
| **— Rémunération —** : Calcul des honoraires | « - » pour un calcul de base, sinon « N° Désignation » de la variante. ◀ **visible seulement en édition et pour un vrai calcul** : « Choisir… » / « Supprimer » |
| Honoraires bruts/HT | éditable seulement si calcul de base |
| Honoraires nets/TTC ◀ | lecture seule. ◀ = « Modifier les conditions… » (calcul de base) ou « Définir les conditions… » (lecture seule) |
| Temps prévu (h) | éditable seulement si calcul de base |
| Coûts supplémentaires bruts/HT | idem |
| Coûts supplémentaires nets/TTC ◀ | idem |
| Total contrat honoraires net/TTC | lecture seule (le 🖩 existe mais est masqué) |
| Facturation | ☐ « Contrat accessible » |

**Validation** : OK actif si Numéro, Désignation, Mandant et Mandataire sont remplis **et** si aucun net n'est « sale ». Il n'y a aucun message : le bouton reste simplement grisé.

**Règle « sale »** :
- une frappe dans un brut passe le net correspondant sur **fond orange** et désactive OK ;
- « Modifier les conditions… » ouvre §4.5 avec ce brut ;
- au retour : brut et net recopiés, plus d'orange, `CONTRACTAMOUNT = net honoraires + net frais`.

**Création** (DeltaSub, écart assumé [D] : même résultat, sans écriture avant OK) :
- préparer le contrat (défauts du §2.2), un calcul de base (`PROJECTFEE_ID` null, `CHANGEDDATE` aujourd'hui) et 2 conditions (`VATRATE` −1) ;
- tout écrire **au seul OK**, en un `DS.commit` ;
- l'original enregistre avant d'ouvrir le dialogue et supprime si l'on annule.

**« Nouveau contrat basé sur un calcul… »** :
- navigateur « Calcul des honoraires » (en-têtes à gauche, variantes à droite, **sans filtre de statut**) ;
- recopies depuis l'en-tête : Type de prestations, Mandant, Mandataire, Contrat avec, Ouvrage ;
- recopies depuis la variante : `TIMEHOUR`, brut et net honoraires, brut et net frais, `CONTRACTAMOUNT = time.AMOUNT2 + cost.AMOUNT2` ;
- **la Désignation n'est pas recopiée** ;
- bruts et temps en lecture seule ; conditions en lecture seule.
- Même recopie quand on choisit une autre variante par ◀. « Supprimer » délie la variante et rend les montants éditables.

**Édition** : relire en base, puis OK = fusion. DeltaSub : `DS.commit` gère le conflit 409.

**Total figé** [D] : seul ce dialogue écrit `CONTRACTAMOUNT`. Si la variante change ensuite, les nets affichés suivent, mais le Total reste figé jusqu'à la prochaine édition (§13).

### 3.6 Ordre, suppression, numérotation [P]

**Ordre** : ↓ = `SORTORDER` + 2 ; ↑ = − 2 ; ⇈ = 0 ; ⇊ = n + 1. Ensuite on trie, on renumérote de 1 à n et on enregistre.

**Suppression**, dans l'ordre :
1. Factures liées ou planification RH : « Le contrat ne peut pas être supprimé parce que les paiements ont été saisi. » (titre « Information »).
2. Documents ou PDF : « Cette inscription ne peut pas être effacée, car il existe encore des documents ou des fichiers PDF. »
3. Sinon : « Voulez-vous vraiment supprimer cette inscription ? » (titre « Avertissement »).
4. Sont supprimés : le contrat, son **calcul de base** et ses 2 conditions (une vraie variante reste), et en cascade ses planifications et encaissements.

**Numérotation** : `count + 1` en texte, modifiable, sans contrôle d'unicité. Doublon possible après suppression (§13).

---

## 4. Calcul des honoraires (`ProjectFee*`, `deltaproject.project.fee.*`)

### 4.1 Écran [P]

- **Deux tableaux côte à côte** et, en dessous, le panneau Documents (« Nouveau document de calcul »).
- **En-têtes** (`ProjectFeeTableModel`) : cadenas, « Numéro » (50 px), « Désignation », « Utilisateur ». Tri mémorisé.
  - Barre : **+** (affaire), **✎** et **−** (1 ligne), **⚙▾** (copier / exporter CSV).
- **Variantes** (`ProjectFeeCalculationTableModel`) : « N° » (50), « Titre », « Désignation », « Version », « Date ».
  - Barre : + (en-tête sélectionné), ✎, −, **📄▾** (4 anciens documents, §10.3), ⚙▾.
  - Le bouton « Dupliquer » est masqué dans l'original : **ne pas reproduire**, pas plus que « Cahier » (classe absente).
- Double-clic = ✎.

### 4.2 Création

1. **Étape 1**, « Choix du mode de calcul des honoraires » : listes « Mode de calcul » (5 modes, défaut Global) et « Contrat selon » (18 valeurs, défaut SIA 1001/1).
2. **Étape 2**, en-tête (« Nouveau contrat d'honoraires » / « Editer le calcul des honoraires ») :
   - Numéro ; Désignation ◀ (« Calcul du contrat », « Calcul de l'avenant », « Précalculation », « Comparaison », « Recalculation ») ;
   - Mode et Contrat selon en lecture seule ;
   - Type de prestations ◀ (9 suggestions du §3.5) ; Mandant ◀ ⓘ ; Mandataire ◀ ⓘ (facultatifs ici) ; Contrat avec ; Ouvrage ; Utilisateur ◀ ; Date 📅 ;
   - Statut ◀ (« validé », « refusé », « interne ») ; Remarque.
   - OK exige Numéro et Désignation.
3. **Étape 3**, variante (« Nouveau calcul » / « Modifier ») : Numéro ; Type de document ◀ (Offre / Contrat / Avenant) ; Désignation ; Date 📅 ; Statut ◀ (Base pour contrat / Etat intermédiaire / Annulé) ; Remarque ; Mode (lecture seule). Puis le bloc « Rémunération » :

| Ligne | Global / Forfaitaire / Autre | Coût de l'ouvrage (3) | Temps employé effectif (4) |
|---|---|---|---|
| Honoraires brut/HT 🖩 | saisi ; 🖩 grisé | lecture seule ; 🖩 = « Calculer » (§4.6.1) | lecture seule ; 🖩 = « Honoraires selon les activités » (§4.7) : AMOUNT1 = Σ, TIMEHOUR = Σ h |
| Honoraires net/TTC 🖩 | 🖩 = « Editer les conditions » (§4.5) | idem | idem |
| Temps prévu (h) | saisi | lecture seule | lecture seule |
| Coûts supplémentaires brut HT 🖩 | saisi ; 🖩 grisé | 🖩 = « Modifier les frais » (§4.8) | idem |
| Coûts supplémentaires net TTC 🖩 | conditions | conditions | conditions |
| **Total contrat honoraires net TTC** | `time.AMOUNT2 + cost.AMOUNT2` | | |

- OK exige Désignation et Type de document. Si un brut a changé depuis les conditions, le TTC passe en orange et OK est désactivé.
- **Bogues d'origine** [P], **à corriger** dans DeltaSub (§13) :
  1. `jOkButtonActionPerformed@109-136` écrit `time.setAmount2(brut)` puis `time.setAmount2(TTC)` : **AMOUNT1 n'est jamais enregistré par OK**. DeltaSub enregistre AMOUNT1 depuis le champ brut.
  2. `isCostAmount2Dirty` compare le brut des **honoraires** : le TTC des frais n'est jamais signalé. DeltaSub compare `cost.AMOUNT1`.
- **Suppression** :
  - variante liée à un contrat : refus (§2.6) ;
  - documents : message du §3.6 ;
  - sinon confirmation standard.

### 4.3 Numérotation, états, verrous [P]

- En-tête : `count + 1`. Variante : `count + 1` dans l'en-tête.
- « Statut » (`VERSION`) est un texte libre, sans machine à états.
- Verrou `DocumentLock` : remplacé par la détection de conflit 409.

### 4.4 Liens [P]

- **Contrat** : voir §3.5. La variante est intouchable tant qu'un contrat la référence.
- **Facture** : import de positions depuis le calcul (§6.5.5). Il n'est proposé que si le contrat enregistré de la facture a un calcul dont le `PROJECTFEE` est en mode 3 ou 4.

### 4.5 « Editer les conditions » (`ProjectFeeCalculationAmountDialog`) : dialogue partagé calcul et contrat

**Disposition** :
- « Brut » ;
- « Rabais » [%] → montant ; « Sous-total » ;
- « Escompte » [%] → montant ; « Sous-total » ;
- « Arrondi » [montant] ; « Sous-total HT » ;
- « TVA » [%] → montant ;
- « Total TTC » 🖩.

Seuls rabais %, escompte %, arrondi et TVA % sont éditables. En lecture seule, le titre est « Conditions ».

**Menu 🖩** :
- « Calculer » ;
- ☑ « Arrondir à 5 ct » ;
- « Calculer l'arrondi » ;
- « Supprimer l'arrondi » ;
- propositions de TTC `floor(TTC/10^i)·10^i` pour i = 0..4 (ex. 186'999.99 → 186'999 / 186'990 / 186'900 / 186'000 / 180'000). Choisir une proposition calcule l'arrondi qui y mène.

Une frappe dans un taux met le TTC en orange et désactive OK jusqu'à « Calculer ».

**Formules** [P : `calcAmount2`, getters de `db.ProjectFeeCalculationAmount`, `util.Formatter.round`] :
```js
const dpRound=(x,cinq)=>{ const f=cinq?20:100, s=x<0?-1:1; return s*Math.round(Math.abs(x)*f)/f; };   // symétrique
function feeCond(a, cible){                 // a = ligne projectfeecalculationamount
  const m=!!a.ISMERCANTILEROUNDING, arr=x=>m?dpRound(x,true):x;       // rabais/escompte/ST arrondis seulement si 5 ct
  const t=(a.VATRATE==null||a.VATRATE<0)?vatDefault():+a.VATRATE;     // vatDefault() = setting genVatRatePos (8.1)
  const A1=+a.AMOUNT1||0, rab=arr(A1*(+a.SALESDISCOUNT||0)/100), st1=arr(A1+rab);
  const esc=arr(st1*(+a.CASHDISCOUNT||0)/100), st2=arr(st1+esc);
  if(cible==null){ const st3=st2+(+a.ROUNDING||0), tva=dpRound(st3*t/100,m); return {rab,st1,esc,st2,rounding:+a.ROUNDING||0,st3,t,tva,ttc:st3+tva}; }
  const tva=dpRound(cible-cible/(1+t/100),m), st3=cible-tva; return {rab,st1,esc,st2,rounding:st3-st2,st3,t,tva,ttc:cible};
}
```

- **OK** enregistre `AMOUNT1`, les deux %, `ROUNDING`, `ISMERCANTILEROUNDING`, `VATRATE` (la valeur affichée, donc explicite dès la première validation) et `AMOUNT2 = ttc`.
- HT d'une ligne de conditions = `st3` ; TVA = `tva`.
- ⚠ Ne **pas** réutiliser `r05` (l.2464) : `Math.round(x*20)/20` diffère pour les négatifs à mi-chemin (−0.025 donne −0.05 en DELTA et 0 dans `r05`).

### 4.6 Mode « Coût de l'ouvrage »

#### 4.6.1 « Calculer » (3 parts, `ProjectFeeTimeCalculationDetailDialog`)

Blocs en lecture seule :

| Bloc | Honoraires | Heures | Source |
|---|---|---|---|
| « Honoraires d'après le temps employé effectif » | 🖩 | « Heures de travail » | Σ lignes de temps hors options (§4.7) |
| « Honoraires d'après le coût de l'ouvrage » | 🖩 | « Temps prévu » | §4.6.2 |
| « Services supplémentaires selon des phases » | 🖩 | « Temps prévu » | Σ services supplémentaires hors options (§4.8) |
| « Total » | somme | somme | |

OK écrit `TIMEAMOUNTPART1..3`, `TIMEHOURPART1..3`, `time.AMOUNT1 = total` et `TIMEHOUR = total heures`.

#### 4.6.2 « Honoraires d'après le coût de l'ouvrage » (modal, minimum 850×725)

**Bloc « Calcul d'honoraires »** :

| Champ | Détail |
|---|---|
| B « Coût d'ouvrage déterminant le temps nécessaire » ◀ | « Calculer… » (§4.6.3) / « Annuler le calcul » / « Import de DELTAdevis… » |
| Z1 ◀ | « Architectes, SIA 102: 0.062 », « Génie civil, SIA 103: 0.075 », « Architectes paysagistes, SIA 105: 0.062 », « Ingénieurs mécaniciens, électriciens et spécialistes en installations du bâtiment, SIA 108: 0.066 » ; la valeur est le texte après « : » ; 4 décimales |
| Z2 ◀ | 10.58 / 7.23 / 10.58 / 11.28 |
| p | calculé |
| q % | défaut 100 |
| r, n, u | défaut 1 |
| Tm | calculé |
| h CHF/h ◀ | « Taux horaire(s) h SIA: 100 CHF/h » ; 100 donne des heures (manuel p.42) |

```
p  = Z1 + Z2 / Math.cbrt(B)                  (p vide si B = 0)                          [P calcFactorP]
Tm = B · p · (q/100) · r · n · u / h          (vide si B = 0 ou h = 0)                   [P calcAmountTm]
```

Si p ou Tm change, le bandeau « **Recalcul nécessaire!** » s'affiche et le pied passe en orange.

**Bloc « Honoraires d'après les phases 3-5 »** :
- Barre :
  - 🖩 « Calculer les phases » : tarif = h pour chaque phase partielle à tarif 0, puis reconstruction ;
  - ✎ « Modifier » (double-clic) ;
  - ⚙▾ : export, « Transférer les heures et les coûts dans l'analyse de l'affaire », « Ajouter les heures et les coûts au budget dans l'analyse de l'affaire ».
- Colonnes : « N° », « Phases », « Part », « % », « Temps nécessaire (Tm) », « Facteur de groupe », « Prévision (Tp) », « Tarifs horaire(s) h », « Prestations spéciales (s) », « Honoraires ».
- Phases en gras, puis ligne total.

```
Tm(pp) = P(pp)/100 · Tm      Tp(pp) = Tm(pp) · I(pp)      H(pp) = Tp(pp) · Rate(pp) · S(pp)
phase = Σ phases partielles (Part, Tm, Tp, H)   ;   Part affichée = P · q/100 (P est stocké « pour q = 100 % »)
```

- **Pied** « Honoraires » ◀ et « Temps prévu » ◀ : **non remplis automatiquement**.
  - ◀ propose le total exact, puis ce total tronqué à 1000 / 100 / 10 / 1 et arrondi à 10 / 100 / 1000, sans doublon ni valeur ≤ 0.
  - OK exige les deux champs, écrit B, Z1, Z2, p, q, r, n, u, Tm et h dans le JSON, puis `TIMEAMOUNTPART2` et `TIMEHOURPART2`.
- **Contrôle à l'ouverture** : si ΣP ≠ 100 et ΣP = q, la question « La répartition des phases ne se réduit pas au facteur q. Voulez-vous corriger cela? » s'affiche. Oui → P := P·100/q.
- **Phase partielle** « Modifier » :
  - « Facteur de groupe » (I) ; « Part (q = 100%) » (P) ; « Part (q <= 100%) » (P·q/100, lecture seule) ; « Tarif horaire par phase » ; « Facteur pour prestations spéciales » (S) ;
  - OK exige une Part.

#### 4.6.3 Coût déterminant B par CFC (`ProjectFeeBkpAmountDialog`)

- À gauche, les groupes principaux (N°, Désignation, Montant). À droite, jusqu'à 10 montants de positions « NN Texte », plus le montant du groupe avec 🖩.
- 🖩 propose Σ des positions, puis ce montant tronqué à 1000 / 100 / 10 / 5 et arrondi à 5 / 10 / ….
- OK : **B = Σ des groupes principaux**.
- **Import du devis DeltaSub** (équivalent de DELTAdevis) : pour chaque code à 1 et 2 chiffres, montant = `dvCompute(E).M.get(code).hon` (l.2478).
  - L'original calcule B = Σ des positions à 2 chiffres. DeltaSub retient **Σ des groupes principaux** dans les deux cas, pour aligner l'écart d'origine [D].

### 4.7 Mode « Temps employé effectif »

- **Récapitulatif** « Honoraires selon les activités » :
  - en-tête « Total x h / y CHF » ; colonnes Groupe d'activités, Activité, Durée, Montant ;
  - **tous** les groupes et activités de l'affaire, ligne Total ;
  - ✎ sur une activité ;
  - ⚙▾ : export + « Transférer en tant que prévision » / « Ajouter en tant que prévision ».
- **Détail** « Honoraires selon le temps effectif » :
  - colonnes Groupe d'activités, Activité, Phase, Phase partielle, Durée, Tarif, Facteur, Montant, Option, Remarque ;
  - barre + ✎ − ⇈ ↑ ↓ ⇊ ⚙.
- **Ligne** (« Nouveau » / « Modifier ») :
  - Groupe d'activités → Activité (**obligatoire**), Phase → Phase partielle (facultative, « Annuler la sélection ») ;
  - Heures, Tarif, Facteur, Montant (calculé), ☐ Option, Remarque 1024 ;
  - OK exige l'activité et 3 nombres valides.
  - Extension facultative [D] : proposer le tarif `rateOfGroup` (l.1252).
- **Transfert vers la prévision** [P, `copyActivityValues`] :
  - « Transférer » remet d'abord à 0 `TIMEBUDGET` et `TIMEAMOUNTBUDGET` de **toutes** les activités et groupes d'activités de l'affaire ;
  - puis on additionne heures et montants par activité et par groupe ;
  - « Ajouter » fait la même chose sans remise à 0.

### 4.8 Frais et services supplémentaires

- **Frais** (modes 3 et 4 seulement), « Modifier les frais » :
  - récapitulatif Groupe de frais / Genre de frais / Montant, avec « Total x CHF » ;
  - détail : Groupe, Genre, Phase, Phase partielle, Quantité, unité, Prix, Facteur, Montant, Option, Remarque ;
  - au retour : `cost.AMOUNT1 = Σ` hors options.
- **Services supplémentaires** :
  - récapitulatif par Phase → Phase partielle ;
  - ligne « Nouvelle inscription » / « Modifier le services supplémentaires » (sic) ; phase partielle obligatoire ; h × tarif × facteur.

### 4.9 Transferts vers les budgets [P, `copyPhaseValues`]

- « Transférer » remet d'abord à 0 `TIMEBUDGET` et `TIMEAMOUNTBUDGET` de **toutes** les `projectphase` et `projectsubphase` de l'affaire.
- Puis, par numéro : Tp va dans `TIMEBUDGET` et H dans `TIMEAMOUNTBUDGET`, pour la phase comme pour la phase partielle.
- **`COSTBUDGET` n'est jamais écrit.**
- DeltaSub : confirmation explicite puis un seul `DS.commit` (l'original n'a pas de transaction propre).

---

## 5. Avancement des prestations (`ProjectImplementationFrame`, `ProjectImplementationDialog`)

- **Nature** [P] : un journal daté **au niveau de l'affaire**.
  - Aucune phase, aucun contrat, aucun calcul d'argent.
  - Seuls `ProjectFrame`, `ProjectPerformanceTableModel` (Management), `Cleanup` et `Update` utilisent la table.
- **Disposition** : barre + ✎ − ⚙▾ ; tableau en haut, graphique en bas (séparateur à 400 px).
  - ✎ et − : exactement 1 ligne ; double-clic = ✎.
  - ⚙ : copier / exporter CSV.
  - **Aucune impression.** « Afficher les semaines » n'existe pas dans le code (bgrep : 0 référence).
- **Colonnes**, 10 fixes : Date | Désignation | Avancement prévu | *(sans titre)* « % » | Utilisateur | Remarque | Avancement effectif | « % » | Utilisateur | Remarque.
  - Valeur < 0 affichée vide ; « % » **toujours** affiché.
  - Tri par date ; à égalité par ID [D].
- **Graphique** « Avancement des prestations » :
  - X = dates distinctes « JJ.MM.AAAA » ; Y « % » à échelle automatique ;
  - séries « Avancement prévu » `#f3622d` et « Avancement effectif » `#fba71b`, points ronds creux ;
  - pas de point pour une valeur < 0, la date reste sur l'axe ; légende en bas ;
  - réutiliser `mgChart` (l.2075).
- **Dialogue** « Nouveau » / « Editer » :
  - Date (lecture seule + 📅, aujourd'hui) ; Désignation (64) ;
  - « Avancement prévu » [chiffres, **3 max**, 0-999 sans borne à 100] « % (mes prestations) », Utilisateur ◀ (pré-rempli par `ME.id`, même si le % est vide ; ◀ = utilisateur courant + « Choisir… »), Remarque (1024) ;
  - même bloc pour « Avancement effectif ».
  - **OK** si Désignation **et** au moins un % rempli, entiers valides. Un % vide est stocké −1 ; les textes sont rognés.
- **Suppression** : « Voulez-vous vraiment supprimer cette inscription ? » (titre « Avertissement »).

---

## 6. Factures d'affaire (`deltaproject.project.ProjectInvoiceFrame`, `ProjectInvoiceDialog`)

### 6.1 Disposition [P]

- À gauche, le tableau « Filtre des contrats » (200 px). À droite, le tableau des factures (400 px).
- En bas, 250 px scindés : à gauche le panneau Documents (§10.5), à droite le **panneau de synthèse du contrat** (§3.4) pour le contrat sélectionné dans le filtre (vide sinon).

### 6.2 Filtre des contrats [P]

- Lignes : « Sans contrat », « Tous les contrats », puis chaque contrat « N° Désignation » (tous, accessibles ou non).
- **« Tous les contrats » n'affiche que les factures qui ont un contrat.** Les factures sans contrat n'apparaissent que sous « Sans contrat ».
- Aucune ligne n'est sélectionnée d'office ; sans sélection, le tableau est vide.

### 6.3 Barre, menus, colonnes [P : GroupLayout, `checkGuards`]

Ordre de la barre : **+ · ✎ · QR · − · 📄▾ · ⚙▾ · ▼▾ [libellé du filtre]** … recherche.

| Bouton | Action | Actif si |
|---|---|---|
| + | nouvelle facture (§6.4) ; contrat = contrat sélectionné (null pour « Sans contrat » ou « Tous »), débiteur = mandant du contrat | affaire ouverte **et** (pas de contrat sélectionné **ou** contrat `ISINVOICEABLE = 1`) |
| ✎ / QR / − | éditer / QR-facture (§9) / supprimer (§6.10) | 1 ligne |
| 📄▾ | « Document de facturation… [Ancien document] », « Document de facturation avec requête de statut… [Ancien document] » (§10.1) | des lignes (chaque entrée exige 1 sélection) ; visible si `isModuleFormVisible = [YES]` |
| ⚙▾ | « Copier le contenu du tableau dans le presse-papier », « Exporter le tableau dans un fichier CSV … » | — |
| ▼▾ | cases « Afficher tout », « Planifiée », « Envoyée », « Rappel envoyé », « Payée » ; le libellé voisin affiche le statut choisi | affaire ouverte |

- Le filtre de statut vaut « Afficher tout » (null) à l'ouverture et **n'est pas mémorisé** [P].
- Recherche : insensible à la casse, sur toutes les colonnes (texte affiché).
- Tri par en-tête, mémorisé ; sélection simple.
- Clic droit : « Modifier… », « Modifier la QR-facture… », séparateur, « Afficher l'entité… » (fiche du débiteur).

**Colonnes** (`ProjectInvoiceTableModel`)
- Masque `all` = `011111111111111` pour le domaine. `allAndProject` = 15 colonnes pour le Contrôle.

| N° | Colonne | Source |
|---|---|---|
| 0 | Affaire | `project.NUMBER` (Contrôle seulement) |
| 1 | Désignation | `NAME` |
| 2 | Numéro | `NUMBER` |
| 3 | Date de facture | `INVOICEDATE` |
| 4 | Date d'échéance | `DUEDATE` |
| 5 | Statut | libellé |
| 6 | Contrat | `NUMBER + " " + NAME` |
| 7 | Débiteur | `contactName` |
| 8 | Monnaie | `project.CURRENCY` |
| 9 | Montant TTC | `AMOUNT` stocké |
| 10 | QR | ✔ si `QRBILL_ID` |
| 11 | Encaissé | `AMOUNTPAID` |
| 12 | Solde à encaisser | `AMOUNT − AMOUNTPAID` |
| 13 | Encaissement | `PAYMENTDATE` |
| 14 | Nb rappels | `DUNNINGLEVEL` |

Pas de total ni de couleur. Le type `browse` (sélecteurs) = Désignation, Numéro, Date de facture, Statut.

### 6.4 Dialogue « Nouvelle facture » / « Editer la facture » [P]

Modal, minimum 640×660.

| Libellé | Règles |
|---|---|
| Numéro | texte ≤ 64, facultatif, **aucune numérotation ni contrôle d'unicité** |
| **Désignation** ◀ | ≤ 255, obligatoire. ◀ = d'abord, si le contrat du dialogue a des planifications, une ligne par planification « Nom, jj.mm.aaaa (facture) ou -, jj.mm.aaaa (encaissement) ou -, CHF 12'345.00 » : cliquer remplit **Désignation, Date de facture, Date d'échéance, Montant** (`ProjectInvoiceDialog$37`). Puis un séparateur, « Facture », « Facture d'acompte », « Facture finale » |
| **Date de facture** 📅 | obligatoire, aujourd'hui par défaut |
| Contrat ◀ | lecture seule. ◀ = « Choisir… » (« Choix du contrat », **contrats `ISINVOICEABLE = 1` seulement**, ☑ « Reprendre le débiteur » **cochée** : débiteur = mandant) / « Supprimer » (l'encaissement lié est détaché du contrat) |
| **Débiteur** ◀ ⓘ | lecture seule, obligatoire. « Choisir… » (Navigateur d'adresses de l'affaire, sélection simple) / « Supprimer » |
| Période facturée ◀ | ≤ 64. Suggestions sur l'année de la date de facture : « Année AAAA », « 1er semestre AAAA », « 2ème semestre AAAA », « 1er trimestre AAAA » … « 4ème trimestre AAAA », puis les 12 « <mois> AAAA » (`MOIS_L`) |
| Statut de la facture | liste des 4 statuts, **libre** |
| Date d'échéance 📅 | facultative, **jamais calculée** |
| Conditions de paiement ◀ | « 10 jours net », « 10 jours, escompte 2% », « 30 jours net », « 30 jours, escompte 2% », « 60 jours net », « 60 jours, escompte 2% », « Selon accord », « Paiement à la commande » |
| Nb rappels | chiffres, 8 max |
| Montant + monnaie | modifiable ; mis à jour par la calculatrice des positions |
| Encaissé + ✎▾ | §7.3 |
| Date dernier encaissement 📅 | active seulement **sans** contrat |
| Remarque | ≤ 255 |
| Bloc « Positions » | §6.5 ; libellé rouge « Recalcul nécessaire! » si `posDirty` |

- **OK actif** si Désignation, Date de facture et Débiteur sont remplis et si Montant et Encaissé sont numériques. Le numéro n'est pas exigé. Aucun verrouillage selon le statut.
- **À l'OK**, dans l'ordre (`jOkButtonActionPerformed`) :
  1. Si Montant > 0 et (`invCheck` renvoie null ou Montant ≠ total recalculé) : confirmation, titre « Le total de la facture ne correspond pas au cumul des positions. », texte « Le montant total de la facture ne prend pas en compte tous les montants. Souhaitez-vous valider la facture en l'état? ». Non = on reste dans le dialogue. Une facture sans position avec Montant > 0 déclenche aussi la question.
  2. Si Encaissé > 0, Encaissé ≥ Montant et statut ≠ Payée : « Voulez-vous modifier le statut de la facture dans Payée ? » (titre « Confirmation »). Oui → 3.
  3. Enregistrer tous les champs (textes rognés) et la préférence « Arrondir ».
  4. Un seul `DS.commit` : facture + positions + encaissement lié. En édition, la relecture et la fusion sont remplacées par le 409.

### 6.5 Positions

#### 6.5.1 Genres et affichage [P]

| Code | Genre | Quantité / Unité | Prix | Unité du prix | Montant affiché |
|---|---|---|---|---|---|
| 0 | Groupe | – | – | – | – |
| 1 | Position | oui | oui | « CHF / unité » | oui |
| 2 | Sous-total | – | – | – | oui |
| 3 | % (Dernier montant) | – | oui | % | oui |
| 4 | % TVA (Dernier montant) | – | oui | % | oui |
| 5 | % TVA incl. (Dernier montant) | – | oui | % | oui |
| 6 | Total | – | – | – | oui |
| 7 | Commentaire | – | – | – | – |

#### 6.5.2 Tableau et barre [P]

- **Colonnes** (8 seulement : « Rabais » et « TVA » n'existent plus) : Genre, Position, Quantité, Unité, Prix, « % », Montant, Visible.
- **Barre** :
  - **+▾** : « Nouvelle position… », « Navigateur de positions… », puis, seulement si la facture n'a **aucune** position, « Importer des positions de factures… » ;
  - les deux imports depuis le calcul (§6.5.5) ;
  - ✎ et − (confirmation standard) ; ⇈ ↑ ↓ ⇊ ; 🖩 recalcul ; ☐ « Arrondir ».
- Une nouvelle position prend le `SORTORDER` de la ligne sélectionnée. Le tri stable la place juste après, puis on renumérote de 1 à n. Sans sélection, elle va en fin de liste.

#### 6.5.3 Dialogue « Nouvelle / Editer la position de facturation » [P]

- **Champs** : « Genre », « Nom » ◀ (≤ 255), « Quantité », « Unité » ◀, « Prix ou taux » [CHF / unité | %], « Total » [CHF], « Visible ».
- **Nom ◀** : navigateurs « Activités… », « Phases… », « Frais… », « Collaborateur… » (dialogue « Sélectionner une position de facturation »). Nom produit : « Groupe | Élément ». Unité « h », prix 0, sauf :
  - Frais : unité et prix unitaire du genre ;
  - Collaborateur : prix = **`STAFFRATE` en vigueur aujourd'hui** (`Staff.getStaffRate(new Date())`). C'est le taux interne du collaborateur, reproduit tel quel ; `rateAt` l.965.
- **Changement de genre** :
  - sans quantité → Quantité 0 ;
  - ≠ Position → Unité vide ;
  - genre TVA avec prix 0 → Prix = `genVatRatePos` (**8.1**) ;
  - sans prix → Prix 0.
- **« Total » est toujours désactivé et affiche 0.00** dans l'original. DeltaSub affiche la valeur calculée, pour l'information seulement ; le montant stocké vient du moteur (§13).
- OK exige un Nom et des nombres valides. Le montant n'est écrit que pour Commentaire, et vaut alors 0.
- Ouvert depuis le controlling : Genre et Visible sont grisés.

#### 6.5.4 Navigateur de positions (gabarits) [P]

- Dialogue « Sélection des positions » : groupes `invoiceposgroup` à gauche, positions à droite, sélection multiple, **tout coché par défaut**.
- 1 position → dialogue de position pré-rempli. Plusieurs → insertion directe.
- `copyFrom` copie nom FR, genre, quantité, unité, prix et visible, **pas le montant** : il faut recalculer.

#### 6.5.5 Imports

- **« Importer des positions de factures… »** (« Navigateur de factures ») : factures du tableau courant (filtres compris ; depuis le Contrôle, toutes affaires confondues), positions cochées par défaut, copie sans montant.
- **Depuis le calcul** (`ProjectInvoicePosImportDialog`, titre « Importer ») : ◉ « Importer les phases » / ◉ « Importer les phases partielles » (défaut), aperçu « Positions de facture », bouton « Importer ».
  - **Facteurs** : une position genre 1 « N° Nom » par phase ou phase partielle, Q 1, « gl », prix = montant = H du §4.6.2.
  - **Prestations supplémentaires** : cumul par phase ou phase partielle des services supplémentaires (options = 0).
  - Les clés de menu `importFromCalculationFactors` et `…AdditionalItems` **n'ont aucun libellé** dans Strings.db. Libellés recommandés : « Importer des positions de calcul (facteurs de calcul)… » et « … (prestations supplémentaires)… », d'après le libellé existant « Importer des positions de calcul » [D].

### 6.6 Moteur de calcul des positions [P : `db.ProjectInvoice.calcProjectInvoicePositions@0-511`]

Le second paramètre booléen de l'original vaut toujours 0 : il est ignoré.

```js
function invCalc(pos, cinq, check){         // pos triées par SORTORDER ; cinq = case « Arrondir »
  let prec=0, cour=0, tot=0, dirty=false; const out=[], vat=[];
  for(const p of pos){ const q=+p.QUANTITY||0, pr=+p.PRICE||0; let a=0;
    switch(+p.TYPECODE){
      case 0: tot+=cour; cour=0; a=0; break;                                 // Groupe
      case 1: a=q*pr; cour+=a; break;                                        // Position : cumul NON arrondi
      case 2: a=cour; break;                                                 // Sous-total (non cumulé)
      case 3: a=pr*prec/100; cour+=a; break;                                 // % : cumul non arrondi, rabais = prix négatif
      case 4: { const t=dpRound(pr*prec/100,cinq); vat.push([pr,t]); cour+=t; a=t; break; }   // % TVA
      case 5: { a=dpRound(prec-prec/(1+pr/100),cinq); vat.push([pr,a]); break; }              // % TVA incl. : NON cumulée
      case 6: a=tot+cour; break;                                             // Total (non cumulé)
      case 7: a=q*pr; break; }                                               // Commentaire (en pratique 0)
    a=dpRound(a,cinq);
    if(check){ if(a!==(+p.AMOUNT||0)) dirty=true; } else out.push(a);        // mode vérification : AMOUNT non modifié
    if(+p.TYPECODE!==7) prec=a; }                                            // un Groupe remet prec à 0
  return {amounts:out, total:dpRound(tot+cour,cinq), vat, dirty};
}
const invCheck=(pos,cinq)=>{ const r=invCalc(pos,cinq,true); return r.dirty?null:r.total; };       // checkCalculation
const posDirty=pos=>pos.some(p=>{ const t=+p.TYPECODE, q=+p.QUANTITY||0, pr=+p.PRICE||0, a=+p.AMOUNT||0;
  if(t===1) return a!==dpRound(q*pr,true)&&a!==dpRound(q*pr,false);          // isInvoicePosAmountDirty
  if(t>=3&&t<=5) return pr!==0&&a===0; return false; });
```

- **Calculatrice** 🖩 : écrit `amounts` dans les positions et `total` dans « Montant ».
- **Conséquences prouvées** :
  - le Montant est la somme des Positions, des % et des TVA non incluses, où que se trouve la ligne Total ;
  - avec « Arrondir », chaque ligne est affichée au 5 ct, mais le cumul porte sur les q×p non arrondis ;
  - **un % TVA porte sur la ligne précédente** : sans Sous-total après un rabais, la TVA porte sur le rabais (cas E du §12).

### 6.7 TVA, HT, factures antérieures, solde du contrat [P : `db.ProjectInvoice`, `db.Project`, `InvoiceDialog`]

```
TVA(f)         = Σ AMOUNT stocké des positions de genre 4 et 5          HT(f) = f.AMOUNT − TVA(f)
Solde(f)       = f.AMOUNT − f.AMOUNTPAID
antérieures(f) = factures de la même affaire, même PROJECTCONTRACT_ID (null = sans contrat),
                 INVOICEDATE strictement < f.INVOICEDATE, tous statuts (y compris Planifiée)
« Factures à ce jour » = Σ AMOUNT(antérieures)      « Payé à ce jour » = Σ AMOUNTPAID(antérieures)
« Montant à recevoir sur le contrat » = contrat.CONTRACTAMOUNT − Σ AMOUNT(antérieures) − f.AMOUNT   (vide sans contrat)
« Paiements à ce jour » (ancien document, projectPreviousPayementSummary) = Σ AMOUNTPAID des factures du même contrat,
                 statut Payée, ≠ f, INVOICEDATE < f.INVOICEDATE ou (même date et ID < f.ID)
```

**Aucune déduction automatique d'acompte** : on ajoute à la main une position négative. Les champs ci-dessus ne servent qu'à l'impression.

### 6.8 Statuts et transitions [P]

- Création = 0 « Planifiée ». Le statut se change librement dans le dialogue, y compris de Payée vers Planifiée, et rien n'est verrouillé.
- Deux questions automatiques :
  - « …dans Payée ? » (§6.4) ;
  - « Voulez-vous modifier le statut de la facture dans « Envoyée » ? », après l'aperçu « avec requête de statut » (§10.1). L'original la pose dès que le statut ≠ Envoyée (§13).
- « Rappel envoyé » et « Nb rappels » se saisissent à la main, indépendamment l'un de l'autre. Il n'existe aucun document de rappel.
- Seules les factures « Planifiée » peuvent recevoir un transfert du controlling (§6.11).

### 6.9 Numérotation et échéance

Ni numérotation, ni échéance calculée dans l'original [P]. Des extensions possibles, à ne faire **qu'avec l'accord de Paulo**, sont au §13.

### 6.10 Suppression [P : `ProjectInvoiceFrame.jDeleteButtonActionPerformed`, `ProjectInvoiceDialog.deleteProjectInvoice`]

1. S'il existe des documents ou PDF : « Cette inscription ne peut pas être effacée, car il existe encore des documents ou des fichiers PDF. » (titre « Information »).
2. Sinon, confirmation « Voulez-vous vraiment supprimer cette inscription ? » (titre « Avertissement »).
3. Sont supprimés : la facture, ses positions et sa QR-facture (cascade), **et l'encaissement lié**, retiré explicitement. Le tout en un `DS.commit`.

### 6.11 Transfert depuis le controlling : heures et frais « facturés » [P : `TimeControllingDialog.editTimeLogCharged`, `TimeLogChargedDialog`, `ProjectCostChargedDialog`]

**Entrée** : Controlling ▸ Heures ou Frais ▸ lignes sélectionnées ▸ « Modifier le statut "Facturé" et transférer en facturation ».

**Avant l'ouverture** :
- montant = `Formatter.round(Σ amount des lignes)` ;
- si une ligne n'est pas facturable : avertissement (`msg1` de `TimeControllingDialog`).

**Dialogue « Editer la sélection »** : « Modifier le statut "Facturé" pour les positions sélectionnées », ◉ « Facturé » / ◉ « Non facturé », « Date » (aujourd'hui), bouton « Transférer en facturation » ▾ (actif si « Facturé »).

**OK** : `ISCHARGED` et `CHARGEDDATE` sur chaque ligne ; la date est null si « Non facturé ».
- **Bogue d'origine** : la date écrite est toujours celle de l'ouverture (champ `chargedDate` fixé @204-212 et jamais relu).
- DeltaSub `ctlFlag` (l.1636) utilise déjà la date choisie : **garder cette correction**.

**Menu de transfert** :
1. Si une ligne est déjà facturée : « Toutes les positions facturables sont déjà choisies. » (avertissement, on continue).
2. Choix de la facture : « Sélectionner une facture » parmi les factures **Planifiée** de l'affaire (`browseProjectInvoiceByState(draft)`).
3. Mode :
   - « Nouvelle position de facture » : 1 position genre 1, nom = libellé du filtre, **Q = 1, unité « h », prix = montant total arrondi**, `SORTORDER = n + 1`, puis dialogue de position ;
   - « … par groupe d'activités / par activité / par phase / par phase partielle / par collaborateur » (heures) ou « … par genre de frais / par phase / par phase partielle » (frais) :
     - une position par clé, nom = libellé de la clé ;
     - heures : Q = Σ h, unité « h », prix = tarif de la ligne (`tlRate`, l.1556) ;
     - frais : Q = Σ quantités, unité du frais, prix = prix unitaire ;
     - **tarifs différents dans une clé** : Q = 1, prix = Σ montants, message « Cette activité a différents tarifs. » (le `msg2` des frais n'a pas de libellé FR ; reprendre le même texte) ;
     - chaque position passe par le dialogue (Genre et Visible grisés) et n'est ajoutée que sur OK.
   - ⚠ **Correction aux rapports** [P, `newProjectInvoicePos@12-14`, dans les deux dialogues] : l'original remet **Visible = vrai** juste avant le dialogue. La position « tarifs mixtes » reste donc visible.
4. Le montant de la facture n'est pas recalculé : la facture affiche « Recalcul nécessaire! ».
5. DeltaSub : positions et marquage dans le même `DS.commit` que l'OK. L'ordre des positions groupées suit l'ordre de tri des clés (l'original utilise un `HashMap`, donc sans ordre) [D].

**Données** : 1 514 heures déjà marquées (2022-08-11 : affaires 702 et 801, 523 lignes ; 2023-01-10 : 902, 181 lignes ; 2025-02-17 : 915, 810 lignes ; 4 392.5 h). Elles sont à respecter. Aucun frais n'a jamais été marqué facturé.

---

## 7. Encaissements reçus et planifiés

### 7.1 « Planifier les encaissements » (depuis le contrat, ✎▾) [P]

- **Fenêtre** « Planifier les encaissements », ou « Plan de paiements » en lecture seule :
  - « Contrat » (lecture seule) ; libellé « Encaissements planifiés » ;
  - colonnes Désignation, Date de la facture, Date d'échéance, Date encaissement, Phase, Phase partielle, Montant ;
  - barre + ✎ − ⇈ ↑ ↓ ⇊ ⚙ (copier / CSV) ;
  - pied « Montant du contrat: X CHF / Total: Y CHF » ; bouton « Fermer ». Un écart n'est pas bloquant.
- **Ligne** : titres « Nouvelle planifification d'encaissement » / « Editer planifification d'encaissement » (faute d'origine ; DeltaSub peut l'écrire correctement, §13).
  - Désignation (64) ◀ « Acompte », « Encaissement final » ;
  - Date de la facture 📅 ;
  - Date d'échéance 📅 ▾ : si la date de facture est remplie, « Date de la facture (jj.mm.aaaa) », « Date de la facture + 10 Jours (…) », + 20, + 30, + 60, puis « Choisir… » ;
  - Date encaissement 📅 (le sélecteur s'ouvre sur la date de facture) ;
  - Montant ;
  - tableaux Phase et Phase partielle (`projectphase` / `projectsubphase`), chacun avec « Annuler la sélection » ;
  - Remarque (1024).
  - **OK** : Désignation, Montant numérique, Date de facture et Date d'échéance remplies.
- **Rôle** : simple suggestion du ◀ Désignation de la facture (§6.4). **Aucune facture n'est générée** [P : le seul `new db.ProjectInvoice` est dans `ProjectInvoiceDialog.newProjectInvoice`, et les classes `ProjectScheduledPayment*` ne référencent pas `db/ProjectInvoice`].

### 7.2 « Editer les encaissements » (depuis le contrat) [P]

- **Tableau** : 🔒 | Désignation | Facture (désignation de la facture) | Date de la facture | Date encaissement | Montant.
- Pied « Montant du contrat: … / Total: … » (un dépassement est accepté).
- ✎ et − sont **grisés sur les lignes à cadenas**.
- **Ligne** (« Nouveau » / « Editer ») : Désignation ◀ (« Encaissement acompte », « Encaissement final », « Versement à sous-traitant ») ; Facture (grisé) ; Date de la facture 📅 ; Date encaissement 📅 ; Montant ; Remarque.
- **OK** [P, `ProjectPaymentDialog.checkGuards`] = Désignation remplie ∧ Montant numérique ∧ (Date encaissement remplie ∨ (Date de facture remplie ∧ Montant = 0)).

### 7.3 Encaissement depuis la facture [P : `ProjectInvoiceDialog.editProjectPayment(Z)`, `$30`, `$31`]

**Sans contrat** : « Encaissé » et « Date dernier encaissement » se saisissent directement dans `AMOUNTPAID` et `PAYMENTDATE`. Aucun `PROJECTPAYMENT` n'est créé.

**Avec contrat** :
- « Encaissé » est en lecture seule, le calendrier désactivé, le bouton ✎▾ visible.
- **« Editer… »** (`editProjectPayment(false)`) :
  - si aucun encaissement n'existe, il est créé : `PROJECTINVOICE_ID`, `PROJECTCONTRACT_ID`, **`SORTORDER` = nombre d'encaissements du contrat + 1** (@55-65) ;
  - il est pré-rempli avec Désignation, Date de facture, Montant et Date d'encaissement de la facture ;
  - puis le dialogue du §7.2 s'ouvre.
- **« Encaissement… »** (`editProjectPayment(true)`) : **écrase toujours** ces 4 valeurs, puis ouvre le dialogue.
- **Au retour** : Encaissé = montant de l'encaissement, Date dernier encaissement = sa date.
- Un seul encaissement par facture (double lien `PROJECTINVOICE.PROJECTPAYMENT_ID` ↔ `PROJECTPAYMENT.PROJECTINVOICE_ID`).
- Si le contrat de la facture change, l'encaissement suit.
- L'enregistrement se fait avec la facture (OK), jamais seul.

---

## 8. FACTURES ▸ Contrôle de factures (`deltaproject.invoice.*`)

### 8.1 Accès et disposition [P]

- Entrée unique de la section « Factures » : `{s:'Factures', items:[['fact-controle','Contrôle de factures']]}`, **entre Tâches et Bâtiment** (`NAV`, après l.342).
- À gauche, la colonne « Catégorie » (240 px). À droite, la barre, le tableau, puis le panneau Documents (séparateur à 750 px).
- Pas de + ni de −. Aucun contrôle de droit : on peut éditer toute facture de toute affaire.
- Patron à réutiliser : `mgCatView` (l.2027), qui mémorise déjà la catégorie.

### 8.2 Catégories [P : `ProjectInvoiceMenuTableModel`, requêtes nommées `db.ProjectInvoice`]

| Ordre | Libellé | Filtre |
|---|---|---|
| 1 | Planifiée | `PROJECTINVOICESTATECODE = 0` **et** état de l'affaire entre 2 et 4 (En cours, En attente, Terminée) |
| 2 | Envoyée | code 1, même borne |
| 3 | Rappel envoyé | code 2, même borne |
| 4 | Payée | code 3, même borne |
| 5 | Toutes | **toutes les factures, sans filtre d'affaire** (y compris affaires Configuration ou Archivée) |

- Tri initial par `INVOICEDATE` croissante. Catégorie mémorisée, la première par défaut.
- Il n'y a **pas** de catégorie « Ouverte ».

### 8.3 Barre et tableau [P]

- Barre : **✎ · QR · 📄▾ · ⚙▾** … recherche (150 px).
  - ✎ et QR : 1 ligne. 📄▾ : des lignes. ⚙ : toujours affiché (entrées actives s'il y a des lignes).
- **📄▾** :
  - « Document de facturation … [Ancien document] » ;
  - **uniquement dans « Planifiée »** : « Document de facturation avec requête de statut … [Ancien document] ».
- **Tableau** : les 15 colonnes du §6.3 (type `allAndProject`), tri par en-tête mémorisé, sélection simple, double-clic = ✎.
  - Pas de menu contextuel, de total ni de couleur.
- **Rafraîchissement** : après OK dans « Editer la facture », recharger la catégorie et resélectionner la facture si elle y est encore. Une facture dont le statut change **disparaît** de la catégorie.
- Après « avec requête de statut », l'original ne recharge pas : **DeltaSub recharge** [D].
- La liste passée au dialogue d'édition (import de positions) est le contenu de la catégorie, toutes affaires confondues.
- Libellés présents mais inutilisés, à ne pas reproduire : `ProjectInvoiceStateFrame.askStateSentMsg/askStatePaidMsg` (« Voulez-vous mettre le statut … à la facture ? »), « Statut de la facture » (`IncoiceStateDialog`), `colInvoiceType` « Type ».

---

## 9. QR-facture (`deltaproject.qrbill.*`, bibliothèque `lib/qrInvoice.jar` = SwissQRBill reconditionnée [D])

### 9.1 Administrateur ▸ « Comptes pour QR-facture » (`QRBillAccountFrame`) [P]

- Barre + ✎ − (✎ et − : 1 ligne ; double-clic = ✎).
- Colonnes « Compte » (`ACCOUNTNAME`), « IBAN », « Description », triées par nom de compte. Description = `NAME` + `, STREET HOUSENO` + `, COUNTRYCODE POSTALCODE LOCATION`.
- **Dialogue** « Nouveau compte » / « Editer le compte » :
  - Nom du compte (128)* ; IBAN (34)* avec étiquette d'état en direct ; Nom (128)* ; Rue et n° (128 / 16) ; NPA/Localité (16 / 128)* ; Pays (2)* ◀ CH / LI ;
  - OK si les champs * sont remplis et l'IBAN valide ; valeurs rognées.
- **Suppression** : « Voulez-vous vraiment supprimer cette inscription ? ». Aucun contrôle d'usage, puisque les QR-factures gardent leur copie.

### 9.2 « Editer la QR-facture » (`QRBillDialog`, 600×640) [P]

**Accès** :
- Factures d'affaire : bouton QR ou clic droit « Modifier la QR-facture… » ;
- Contrôle de factures : bouton QR ;
- panneau Documents : « QR-facture… » (§10.5).

**Initialisation**, s'il n'y a pas encore de QR-facture :
- `CURRENCY` « CHF » ;
- créancier = le compte QR **s'il en existe exactement un** ;
- `AMOUNT` = `projectinvoice.AMOUNT` ;
- débiteur depuis le `CONTACT` de la facture : `DEBTORNAME = NAME1`, rue rognée et coupée au **dernier espace** (avant → rue, après → n° ; sans espace ou espace en position 0 : tout dans la rue), pays, NPA, localité.

**Sections** :
1. « Compte / Payable à » : Compte [34] ◀ (comptes « nom, IBAN », 21 au plus, séparateur, « Sélection du compte… »), Nom [70], Rue et n° [70][16], NPA/Localité [16][35], Pays [2] ◀ CH/LI.
2. « Information du paiement » :
   - Monnaie [CHF | EUR] ;
   - Montant ◀ (« CHF 12'345.60 » = montant de la facture) ;
   - « Référence créancier », ou « Référence QR » si l'IBAN est un QR-IBAN [128] ;
   - « Informations supplémentaires » [128] ◀ : désignation ; « désignation numéro » ; « nomContrat numéroContrat / désignation numéro » ; « numéroAffaire / désignation numéro » ; « numéroAffaire / nomContrat numéroContrat / désignation numéro » (sans doublon) ;
   - « Information de facture » : **masquée**.
3. « Payable par » : Nom [70] ◀ (NAME1 ; si NAME2 existe et diffère, NAME2 et « NAME1 NAME2 », affichés « nom, localité »), Rue et n°, NPA/Localité, Pays ◀.

**Boutons** : « Créer la QR-facture », « OK », « Annuler ». « Valider la facture QR » et le bouton « formatReference » (calcul de la référence) n'existent qu'en développement.

**Contrôles en direct** :
- créancier complet (nom, NPA, localité, pays) ;
- IBAN (§9.3) ;
- montant 0 ≤ m < 99 999 999 999, sinon « Montant invalid » ;
- cohérence : monnaie ≠ affaire → « Vérifier la monnaie de facturation! » ; sinon montant ≠ `AMOUNT` → « Vérifier le montant de la facture! » ;
- référence : QR-IBAN sans référence → « Une référence QR doit être fournie pour QR-IBAN. » ; QRR → « La QR-référence est valide. » / « … n'est pas valide. » ; IBAN ordinaire → « La référence est facultative. » / « Référence de créancier valide. » / « … invalide. » ;
- débiteur : entièrement vide, ou nom + NPA + localité + pays.

**Boutons conditionnés** :
- **OK** : créancier ∧ IBAN ∧ montant ∧ débiteur valides (**la référence n'est pas exigée**) ;
- **« Créer la QR-facture »** : mêmes conditions **+ référence valide**. Il utilise les valeurs en cours d'édition, sans les enregistrer.

**À l'OK** :
- si la bibliothèque trouve des erreurs : « La facture contient des erreurs.\nVoulez-vous quand même la créer? » (Oui enregistre) ;
- écriture : `qrbill` + `projectinvoice.QRBILL_ID`, un seul `DS.commit` ;
- référence, message et information de facture rognés ; autres champs tels quels (DeltaSub : tout rogner, §13).

### 9.3 Règles [P : `deltaproject.qrbill.QRBill`, `qrbill.generator.Payments/Validator`]

- **IBAN (DELTA)** :
  - sans espaces ; préfixe « CH » ou « LI » (sensible à la casse) ; longueur **21** ;
  - `mod97 == 1`, avec 2 lettres + 2 chiffres en tête et une clé différente de 00, 01 et 99 ;
  - calcul de `mod97` : rotation des 4 premiers caractères en fin, chiffre → `r = r*10 + d`, lettre → `r = r*100 + (L − 'A' + 10)`, `r %= 97` dès que r > 9 999 999.
- **Messages IBAN** : « IBAN valide (CH ou LI) » (QR-IBAN), « N° IBAN valide (CH ou LI) », « N° IBAN incorrect (CH ou LI) ».
- **QR-IBAN** : caractère 4 = '3' et caractère 5 ∈ {'0','1'} (QR-IID 30000-31999).
- **QRR** :
  - sans espaces, complété à gauche par des zéros jusqu'à 27, numérique, différent de 27 zéros ;
  - `mod10` récursif avec la table `[0,9,4,6,8,2,7,1,3,5]` (`c = T[(c+d)%10]`, clé `(10−c)%10`), `mod10(référence) == 0`.
  - Une QRR avec un IBAN ordinaire est refusée.
- **SCOR (ISO 11649)** : 5 à 25 caractères alphanumériques, « RF » + 2 chiffres, `mod97 == 1`. Aucune génération en production.
- **Type de référence automatique** : commence par « RF » → SCOR ; non vide → QRR ; vide → NON.
- **Montant** :
  - 0 → **pas de montant** (case vide sur le bulletin) ;
  - sinon arrondi à 2 décimales (HALF_UP), plage 0 à 999 999 999.99 (la bibliothèque a le dernier mot) ;
  - monnaie CHF ou EUR ;
  - **aucun calcul** (TVA, 5 ct) : c'est une copie de `AMOUNT`.
- **Adresses structurées (« S »)** : nom, NPA, localité, pays obligatoires ; longueurs 70/70/16/16/35/2.
- **Informations supplémentaires** : message + information de facture ≤ 140 caractères ; `billInformation` doit commencer par « // ».
- **Jeu de caractères** : sous-ensemble latin-1 ; les autres caractères sont remplacés.
- **Messages de la bibliothèque** : clés anglaises brutes (`account_iban_invalid`…) → à traduire en FR dans DeltaSub (§13).

### 9.4 « Créer une QR-facture » (`GenerateQRBillDialog`, 500×418) [P]

| Réglage | Valeurs |
|---|---|
| « Langue » | Deutsch, Français, Italiano, English |
| « Format du papier » | « Portrait A4 » (210×297, bulletin en bas), « Facture QR uniquement » (210×105), « Code QR uniquement » (46×46) |
| « Lignes de séparation A4 » | « Sans », « Ligne continue », « Ligne continue avec des ciseaux » (les pointillés sont réservés au développement) |
| État | « Facture valide. » / « Facture invalide. » ; OK seulement si la facture est valide |
| Destination A | « Enregistrer la QR-facture dans les documents de facturation » : « Nouveau fichier PDF » (nom « Bulletin de versement QR », « .pdf » ajouté ; « Le fichier existe déjà. Voulez-vous le remplacer ? »), « Ajouter le QR-facture à la fin de la facture » (dernière page), « Ajouter le QR-facture comme nouvelle page à la fin ». L'ajout **force le format 210×110** |
| Destination B | « Enregistrer la QR facture sous forme de fichier PDF » (présélectionnée s'il n'y a pas de dossier) |
| Option | ☐ « Afficher le fichier PDF » |

- **Préférences** : langue, format, séparateur, destination, mode d'ajout, afficher. Défauts d'origine : Deutsch, Portrait A4, Sans, documents, « à la fin de la facture », non coché.
- **DeltaSub** : défaut « Français » (écart assumé).
- La QR-facture ne change pas le statut et n'enregistre pas le PDF en base.

### 9.5 Rendu [P : `qrbill.generator.BillLayout`, `QRCodeText`]

**Dimensions** :
- bulletin 210×105 mm ; récépissé 62 mm (texte sur 52) ; section paiement 148 mm ; marges 5 mm ;
- QR-code **46×46 mm à (5, 42) mm** dans la section paiement, correction **M**, croix suisse vectorielle au centre ;
- zone montant 46 mm de large, haut à 37 mm ; informations 87 mm de large.

**Polices** : Helvetica (ou Arial). Titres « Récépissé » et « Section paiement » 11 pt gras.
- Section paiement : libellés 8 pt gras, textes 10 pt, réduits de 1 pt jusqu'à 8 pt si le texte déborde.
- Récépissé : libellés 6 pt gras, textes 8 pt.

**Contenu** :
- Récépissé : « Compte / Payable à », « Référence », « Payable par » (ou « Payable par (nom/adresse) » avec cadre 52×20), « Monnaie », « Montant » (cadre 30×10 s'il n'y a pas de montant), « Point de dépôt » (aligné à droite, à 23 mm du bas).
- Section paiement : titre, QR-code, « Monnaie » / « Montant » (cadre 40×15), « Compte / Payable à », « Référence », « Informations supplémentaires », « Payable par » (cadre 65×25). Cadres à coins de 0,75 pt.

**Formats d'affichage** :
- IBAN par groupes de 4 ; QRR par groupes de 5 alignés à droite ; SCOR par 4 ;
- montant « 1 234.50 » (espace des milliers) ;
- adresse sur 3 lignes : nom / « rue n° » / « NPA localité ». Le préfixe « CC – » n'apparaît que pour une adresse étrangère (pour le créancier, dès que l'une des deux l'est).

**Séparateurs** :
- vertical à x = 62 mm ; horizontal à y = 105 mm (absent en « Facture QR uniquement ») ;
- ciseaux aux ruptures (vertical 97-100 mm, horizontal 5-8 mm) ;
- épaisseur du trait continu 0,5.

**Texte du QR-code** (lignes séparées par LF) :
```
SPC / 0200 / 1 / IBAN / S / nom / rue / n° / NPA / localité / pays / (7 champs vides) / montant « 0.00 » ou vide / monnaie /
S + 6 champs débiteur (ou 7 vides) / type de réf. / référence / message non structuré / EPD / [information de facture]
```

**Encodeur** : DeltaSub est autonome (aucun script externe, seul un `<script>` en ligne l.131). Il faut donc écrire en JS l'algorithme de Nayuki : mode octet, correction M, version automatique, masque optimal. Le rendu se fait en SVG et l'impression par `window.print` avec `@page`.

---

## 10. Impressions et exports

### 10.1 Facture

- **Ancien document** (📄▾, visible car `isModuleFormVisible = [YES]`) :
  - modèle `modele` catégorie `projectTemplates`, type `projectInvoice`, `project1`, groupe de l'affaire (défaut « Substances », police Akkurat) via `tplFind` (l.3458) puis `tplPrint` (l.3505) ;
  - `ctx.fields` : `projectInvoiceNumber`, `projectInvoiceDate`, `projectPaymentDate` (échéance), `projectInvoiceAccountingPeriod`, `projectPreviousPayementSummary` (§6.7), `address` (débiteur), `documentTitle` = désignation ;
  - `ctx.total` / `totalHT` / `totalTVA` = `AMOUNT` / HT / TVA ;
  - tableau `projectConditionTable` = positions **visibles** ; quantité et unité seulement pour le genre 1, prix pour les genres 1, 3, 4, 5.
  - **Étapes** [P, `InvoiceDialog.openDialog`] :
    1. si `posDirty` : « Les positions de la facture doivent être vérifiées. Afficher la facture quand même ? » (Oui/Non) ;
    2. aperçu ;
    3. si « avec requête de statut » : « Voulez-vous modifier le statut de la facture dans « Envoyée » ? », puis enregistrement immédiat et **rechargement**.
  - « Paramètres » (`TEMPLATEPROPERTIES`) : Modèle, Page de garde, quantités et prix, unités, totaux bruts, sous-total avant TVA, titres de colonnes, fond alterné, traits, polices, interligne, désignation du total. **Lot 7** ; en V1, valeurs du modèle.
- **Nouveau document `.dpdoc` « Facture »** (jeux 1 ≡ 2, A4 portrait, marges g25 d15 h25 b20). Bandes :
  1. Adresse (débiteur, `contactAddress`, marge gauche 90, haute 20) ;
  2. Titre = désignation ;
  3. Informations : Affaire (N° et titre) ; Contrat « CHF <contrat> (TTC) » ; « N° de facture » ; « Date de facture » (long) ; « Date d'échéance » (long) ; « Période facturée » ; « Montant » ; « Remarque » ;
  4. tableau « Facture » : Position 50, Quantité 20, Unité 20, Prix 20, % 10, Montant 30 ;
  5. « Conditions de paiement : » ; « Avec nos remerciements. »
  - Styles de ligne : Groupe → `tableLevel1`, Sous-total → `tableLevel1Total`, Total → `tableTotal`, sinon `tableRow`. L'alternance repart après un Groupe ou un Sous-total.
  - **Champs** `doc.data|ProjectInvoice` : name, number, accountingPeriod, contact, invoiceDate, dueDate, projectInvoiceState, termsOfPayment, amount, amountExcludedVat, amountVat, amountPaid, paymentDate, note, dunningLevel, projectContract, projectContractSubProject, previousInvoicesAmount, previousInvoicesAmountPaid, contractAmountNotInvoiced.
  - **Tableaux** : positions ; « Factures à ce jour (contrat) » (Désignation, Numéro, Date, Montant TTC, Encaissé, Encaissement, Monnaie, HT, TVA, ligne Total).
  - **Moteur** : `mgPrint` (l.1980) ne lit que le jeu 0 (`'0/'+type`) : **ajouter un paramètre de jeu** (`'1/projectInvoice-fr.dpdoc'`). Lot 7.

### 10.2 Contrat

- **Ancien « Récapitulatif contrat honoraires »** (`projectContractOverview`, page de garde seule, groupe Substances). Champs : `projectContractNumber`, `…Date`, `…Status`, `…SupplierDesc`, `constructionContractKind`, `projectContractContact` et `projectContractSupplier` (adresse, téléphone, courriel), `projectContractTimeHour`, `projectContractTimeAmount` (TIMEAMOUNT2), `projectContractCostAmount` (COSTAMOUNT2), `amountTotal` (CONTRACTAMOUNT), `projectCurrency`, `note`. **Lot 1**, via `tplPrint`.
- **`.dpdoc` « Contrat d'honoraires »** (7 sections : page de garde, objet, éléments, conditions de paiement, intervenants, organisation, contrat court).
  - Champs `report.ProjectContract$StringField` et signature.
  - Tableaux `timeCalculationTable` et `costCalculationTable` (cascade des conditions), `scheduledPaymentTable` et `paymentTable`.
  - Récapitulatif HT / TVA / TTC : ligne honoraires = `Amount1`, ligne frais = `st3`, total = `ctrHT | ctrVat | CONTRACTAMOUNT`.
  - Lot 7.

### 10.3 Calcul des honoraires

- **Anciens documents** (📄▾ des variantes) : `projectFeeOverview` « Récapitulatif », `projectFeePhases` « Honoraires selon les phases 3 - 5 », `projectFeeTime` « … selon les activités », `projectFeeCost` « Frais », suffixe « [Ancien document] ».
  - `fee.Phases` refuse si ΣP ≠ 100 et ΣP = q : « …Vous devez corriger cela dans la fenêtre de saisir. »
  - Lot 2, via `tplPrint`.
- **`.dpdoc` « Offre d'honoraires (calcul) »** : 8 sections, facteurs `calculationFactors*`, tableaux des conditions, des phases, des CFC et des lignes. Nom « N° Type de document ». Lot 7.

### 10.4 Exports

Les exports « Copier le contenu du tableau dans le presse-papier » et « Exporter le tableau dans un fichier CSV … » (`mgGear` l.1976, `copyTable` et `csvTable` l.746-747) concernent :
- les factures d'affaire ;
- le Contrôle de factures ;
- les en-têtes et variantes de calcul ;
- tous les tableaux du calcul ;
- l'avancement ;
- la planification et les encaissements.

**Le tableau des contrats n'a pas d'export** [P].

### 10.5 Documents et PDF par objet (panneau Documents) : décision

- **Original** : un dossier par objet, `…/<PROJECT.ID>/Invoices/<ID facture>` (de même `Contracts/<ID>` et le dossier du calcul). Menus :
  - « Document » ▾ : Nouveau, Renommer, Supprimer, Ouvrir, Enregistrer sous forme de fichier PDF ; plus « QR-facture… » pour une facture, « Afficher le calcul des honoraires » et « Importer des fichiers PDF du calcul » pour un contrat ;
  - « Fichiers PDF » ▾ : Ouvrir, Partager, Import fichier PDF, Fusionner PDF, Supprimer.
- **DeltaSub n'a pas de stockage de fichiers** : `/api/` n'offre que ping, snapshot, ids, commit et changes.
- **V1 (lots 1 à 6)** :
  - pas de panneau ; impression et PDF par le navigateur ;
  - les refus « documents existants » ne s'appliquent pas ;
  - « QR-facture… » est accessible par le bouton QR.
- **Lot 7** : point d'accès `/api/files` dans `serveur_deltasub.py`, sous `~/Library/Application Support/DeltaSub/documents/<PROJECT_ID>/Invoices/<ID>`, puis ajout des refus de suppression.

---

## 11. Plan d'implémentation par lots et points d'ancrage DeltaSub

### 11.1 Lots

| Lot | Livrables | Dépend de | Tests d'acceptation (§12) |
|---|---|---|---|
| **0 Socle** | `dpRound`, `vatDefault()` (lecture `setting` `SETTINGNAME = 'genVatRatePos'`), `feeCond`, `invCalc`, `invCheck`, `posDirty`, `prevInvoices`, `paidToDate`, `openContract`, `ctrTime1/2`, `ctrCost1/2`, `ctrVat`. Suppression des 4 entrées de `why` (l.1547-1548) et ajout des domaines à `domainUsed` (l.1481) au fil des lots. Intégrité (§2.6) dans `delContact`, `delOwner`, `cfgPhases`, `cfgActivities`, `delProject` | — | C1-C9, F1-F11, arrondi négatif |
| **1 Contrats** | domaine (§3), dialogue, conditions (§4.5, mode calcul de base), ordre, suppression, panneau de synthèse, planification (§7.1), encaissements du contrat (§7.2), ancien récapitulatif (§10.2) | 0 | contrat 501 affiché à l'identique (173'630.45 / 186'999.99 / 7.7 %) ; règles OK ; numérotation |
| **2a Calcul** | domaine (§4.1), étapes 1 à 3, modes 1, 2 et 5, conditions, lien contrat (« basé sur un calcul », ◀ Choisir / Supprimer), corrections des 2 bogues | 0, 1 | T4, T6, T7 ; OK n'efface pas AMOUNT1 |
| **2b SIA** | §4.6 (SIA, phases 3-5, JSON, CFC, import du devis, « Calculer » 3 parts) | 2a | T1, T2, T3, T8 |
| **2c Temps / frais** | §4.7, §4.8, transferts §4.9 (confirmation) + anciens documents du calcul | 2a | Σ hors options ; transfert remis à zéro puis additionné |
| **3 Avancement** | §5 (tableau, dialogue, graphique `mgChart`) | 0 | A1-A5 |
| **4 Factures** | §6.1-6.10, §7.3, admin « Gabarits de facturation » et « Taux de TVA », impression §10.1 (ancien document) | 0, 1 | F1-F11, statut Payée, suppression en cascade, SORTORDER encaissement = n + 1 |
| **5 Contrôle + transfert** | §8, §6.11 dans `ctlFlag` | 4 | catégories et borne d'affaire ; Toutes inclut les affaires archivées ; tarifs mixtes |
| **6 QR** | §9 : comptes (admin), éditeur, validation, encodeur, rendu, sortie « nouvelle page » et « PDF » (l'ajout sur la dernière page vient ensuite) | 4 | Q1-Q6 ; le QR-code se lit avec une application bancaire |
| **7 Compléments** | documents serveur (§10.5), `.dpdoc` jeux 1/2 (`mgPrint` généralisé), paramètres de l'ancien document, import des positions depuis le calcul (§6.5.5), mise à jour de `spec_management` §6/§8 et vues Management Contrats et Factures | 2, 4, 6 | — |

### 11.2 Points d'ancrage (`DeltaSub.html` @ ee71f56)

**Navigation**
- `NAV` l.336-347 : insérer la section Factures après l.342.
- `VIEWS` l.347 ; `go` l.360 ; `hit` l.371 (rafraîchissement : `hit(ts,'projectinvoice','projectinvoicepos',…)`).

**Données**
- `DS` l.161 : `who` l.163, `newIds` l.185, `commit` l.186, `save` l.199.
- `ME.id` l.410 (USERID).

**Interface**
- `grid` l.289, `gridSel` l.320, `phead` l.322, `col` l.331, `dialog` l.271, `confirmDlg` l.284, `popMenu` l.259, `ibtn` l.251, `setTools` l.256.
- `formRows` et `readK` l.1128-1129, `monthNav` l.1454.

**Formats**
- `num` l.143, `dfr` et `diso` l.147-148, `nm` l.218, `MOISL` l.403, `MOIS_L` et `dLong` l.3462-3463.

**Référentiels**
- `contactName` l.389, `staffName` l.390, `pickContact` l.950, `rateAt` l.965 (STAFFRATE), `rateOfGroup` l.1252.
- `editProject` l.1134 (`CONTACT2_ID` « Adresse de facturation », suggestion possible de débiteur [D]).

**Intégrité** : `delOwner` l.795, `delContact` l.809, `delProject` l.1176, `cfgPhases` l.1186 (refus l.1197), `cfgActivities` l.1211 (refus l.1228).

**Domaines**
- `DOMAINS` l.1460, `domainUsed` l.1481.
- `domainView` l.1485 : 4 branches `if(d==='Contrats honoraires')…`, sur le modèle de « Frais » (`phead` + `pane` + `grid`).
- `why` l.1547-1548 : supprimer les 4 entrées.

**Controlling** : `tlDate` l.395, `pcAmount` l.1371, `tlRate` l.1556, `VIEWS['aff-controlling']` l.1558, `ctlFlag` l.1636 (ajouter le bouton « Transférer en facturation ▾ »).

**Administrateur** : `VIEWS['config']` l.1902 (liste `cats` l.1906 : ajouter « Gabarits de facturation », « Comptes pour QR-facture », « Taux de TVA ») et `admPane` l.1912.

**Management et impression**
- `mgGear` l.1976, `mgPrint` l.1980 (jeu 0 seulement), `mgPrintHTML` l.2018, `mgCatView` l.2027, `mgChart` l.2075, `mgSaveChart` l.2093.
- `tplPageHTML` l.3298, `TPL_TABLES` l.3288, `tplFind` l.3458, `tplFieldValue` l.3469, `tplTableHTML` l.3497, `tplPrint` l.3505, `tplOr` l.3539.

**Bâtiment** : `dvCompute` l.2478 (`.hon`) ; **ne pas réutiliser** `r05`/`r2` (l.2464).

**Serveur** : `serveur_deltasub.py`, `import_deltaproject` : voir le risque du §13.

---

## 12. Valeurs de contrôle

Les recalculs sont faits par `hf_critique/verif_fact.py` et `hf_calculhono/verif.py`.

**Conditions et contrat (§4.5)**

| # | Entrée | Attendu |
|---|---|---|
| C1 | ligne réelle 502 : 173'630.45, TVA 7.7, sans 5 ct | TVA 13'369.54 ; TTC **186'999.99** = `AMOUNT2` = `CONTRACTAMOUNT` du contrat 501 ✔ |
| C2 | manuel p.41 : 100'000, rabais −2, TVA 7.7 | −2'000 / 98'000 / TVA 7'546.00 / TTC **105'546.00** |
| C3 | frais 5'000 à 7.7 | 5'385.00 ; total contrat 110'931.00 |
| C4 | 123'456.78, rabais −3, escompte −2, TVA 8.1, 5 ct | rabais −3'703.70 ; ST1 119'753.10 ; escompte −2'395.05 ; ST2 117'358.05 ; TVA 9'506.00 ; TTC 126'864.05 |
| C5 | cible 187'000 à 8.1 depuis 173'630.45 | TVA 14'012.03 ; ST3 172'987.97 ; arrondi −642.48 |
| C6 | cible 187'000 à 7.7 depuis 173'630.45 | TVA 13'369.55 ; arrondi 0.00 ; TTC 187'000.00 |
| C7 | manuel p.41-43 : 226'530 HT à 7.7, TTC affiché 243'900 | seul l'arrondi −67.60 (cible 243'900) reproduit la capture : TVA 17'437.60 ; ST3 226'462.40 [D] |
| C8 | propositions pour 186'999.99 | 186'999 / 186'990 / 186'900 / 186'000 / 180'000 |
| C9 | `VATRATE` −1 (ligne 501) | taux 8.1 à l'ouverture |

**Calcul SIA (§4.6)**

| # | Entrée | Attendu |
|---|---|---|
| T1 | B 1'000'000, Z1 0.062, Z2 10.58, q 100, r = n = u = 1, h 100, parts par défaut, tarifs 135 | p 0.1678 ; Tm 1'678.00 h. Phases partielles : 31 = 151.02 h / 20'387.70 ; 32 = 352.38 / 47'571.30 ; 33 = 41.95 / 5'663.25 ; 41 = 302.04 / 40'775.40 ; 51 = 268.48 / 36'244.80 ; 52 = 486.62 / 65'693.70 ; 53 = 75.51 / 10'193.85. Total **1'678.00 h / 226'530.00** (capture p.42) |
| T2 | B 551'400 | p 0.1910 ; Tm 1'053.29 h. La capture du manuel, avec ce B, est incohérente (Z1 saisi « 00620 ») |
| T3 | T1 avec q 80 | Tm 1'342.40 ; ligne 31 = 7.20 % / 120.82 h |
| T8 | propositions du pied pour 226'530 / 1'678 | [226'530, 226'000, 226'500, 227'000] / [1'678, 1'000, 1'600, 1'670, 1'680, 1'700, 2'000] |

**Positions de facture (§6.6)** : 1 × 1'000.30 = une position de quantité 1 au prix de 1'000.30.

| # | Positions | Montants des lignes | Total, TVA, HT |
|---|---|---|---|
| F1 | manuel p.46 : Groupe ; 6 positions (17 + 47.5 + 16.25 + 20.25 + 24.75 + 8.5 h) × 130 ; Sous-total ; % TVA 8 ; Total | Sous-total 17'452.50 ; TVA 1'396.20 ; Total 18'848.70 | **18'848.70**, TVA 1'396.20, HT 17'452.50 |
| F2 | gabarits 52 + 102 : 10'000, rabais −5, TVA 8.1 | 10'000 / 10'000 / 10'000 / −500 / 9'500 / 769.50 / 10'269.50 | **10'269.50** |
| F3 | idem : 100'000, rabais −2, TVA 8.1 | … / 98'000 / 7'938 | **105'938.00** |
| F4 | 1 × 1'000.30 ; TVA 8.1 ; Total | sans « Arrondir » : 81.02 | **1'081.32** |
| F5 | F4 avec « Arrondir » | 81.00 | **1'081.30** |
| F6 | 1 × 10.02 ; 1 × 10.02 ; Sous-total, avec « Arrondir » | 10.00 / 10.00 / **20.05** (cumul non arrondi) | 20.05 |
| F7 | 1 × 1'081 ; Total ; TVA incl. 8.1 | 81.00 (non cumulée) | **1'081.00**, TVA 81, HT 1'000 |
| F8 | Groupe ; 1 × 10'000 ; % −10 ; % TVA 8.1 ; Total (sans Sous-total) | −1'000 / **−81.00** | **8'919.00** (le piège) |
| F9 | F8 avec Sous-total avant la TVA | −1'000 / 9'000 / 729 | **9'729.00** |
| F10 | 1 × 1'000 ; Commentaire ; TVA 8.1 ; Total | le Commentaire ne change pas `prec` : TVA 81 | 1'081.00 |
| F11 | Groupe ; 2 × 100 ; Sous-total ; Groupe ; 1 × 50 ; Sous-total ; Total ; TVA 8.1 ; Total | 200 / 200 / 0 / 50 / 50 / 250 / 20.25 / 270.25 | **270.25** |

**Arrondi**
- `dpRound(−0.025, true)` = −0.05, alors que `r05(−0.025)` = 0.
- `posDirty` : genre 1 avec Q × P = 10.02 et montant 10.00 → propre (5 ct) ; montant 0 → sale. Genre 4 avec prix 8.1 et montant 0 → sale.

**Règles de dialogue**

| # | Situation | Attendu |
|---|---|---|
| R1 | Facture : Encaissé = Montant = 1'000, statut Envoyée | question « …dans Payée ? » |
| R2 | Facture : Encaissé = 0 | pas de question |
| R3 | Encaissement : Désignation « Encaissement final », Montant 0, date de facture seule | OK actif |
| R4 | Encaissement : Montant 500, date de facture seule | OK grisé |
| R5 | Encaissement créé depuis une facture d'un contrat qui a déjà 2 encaissements | `SORTORDER` = 3 |
| R6 | Contrôle de factures, facture Planifiée d'une affaire archivée (5) | absente de « Planifiée », présente dans « Toutes » |
| R7 | Domaine Factures : « Tous les contrats » avec une facture sans contrat | cette facture n'y figure pas |

**Avancement**

| # | Situation | Attendu |
|---|---|---|
| A1 | Désignation vide, ou les deux % vides | OK grisé |
| A2 | saisie « 150 » | acceptée et stockée 150 ; « 1000 » impossible (3 chiffres) |
| A3 | effectif seul | un seul point, la date reste sur l'axe |
| A4 | nouvelle ligne | les deux utilisateurs valent `ME.id` |
| A5 | export CSV | identique au tableau |

**QR-facture**

| # | Entrée | Attendu |
|---|---|---|
| Q1 | QRR `createQRReference('21000000000313947143000901')` | `210000000003139471430009017` |
| Q2 | QRR brute `12345` | `000000000000000000000123457` |
| Q3 | SCOR `539007547034` | `RF18539007547034` ; `mod97('RF18539007547034') = 1` ✔ |
| Q4 | IBAN `CH9300762011623852957` (IBAN d'exemple public) | `mod97 = 1`, 21 caractères, valide |
| Q5 | IBAN en minuscules « ch… » | refusé par l'original (§13) |
| Q6 | montant 0 | aucun montant dans le QR ; cadres de montant vides |

**Données réelles**
- Contrat 501 : affaire 915, n° 1, Maître d'ouvrage, Validé, accessible, calcul de base 501, conditions 502 (honoraires) et 501 (frais).
- Aucune facture ni aucun encaissement.

---

## 13. Incertitudes restantes et choix recommandés

| # | Question | Original | Choix recommandé |
|---|---|---|---|
| 1 | Libellé du domaine | « Offres d'honoraires » (version installée) / « Calcul des honoraires » (manuel) | **« Calcul des honoraires »** : déjà dans `DOMAINS`, vocabulaire du bureau |
| 2 | Mode honoraires du contrat | lié à la licence | **toujours complet** (aucune licence importée) |
| 3 | Bogues qui perdent ou faussent des données | AMOUNT1 de la variante non enregistré ; indicateur « frais à recalculer » faux ; date « Facturé » figée ; SIA 1012/4 = 121 | **corriger** : AMOUNT1 enregistré, `cost.AMOUNT1` comparé, date choisie (déjà fait l.1636), code **124** documenté |
| 4 | Champ « Total » du dialogue de position | toujours 0.00 | afficher la valeur calculée (information seulement) |
| 5 | « Envoyée » proposée pour une facture Payée ou Rappel | oui | **ne proposer que si le statut est Planifiée** (écart assumé, évite de rétrograder une facture payée) ; sinon fidélité à défaut d'accord |
| 6 | « Tous les contrats » exclut les factures sans contrat | oui | reproduire |
| 7 | Numéro de facture | aucun | **laisser libre** (fidélité). Option à soumettre à Paulo : proposer « max numérique de l'année + 1 », sans jamais le calquer sur `Facturation.html` |
| 8 | Numéro de contrat | `count + 1`, doublon possible | `max(numéro numérique) + 1` (écart mineur) |
| 9 | Échéance | jamais calculée | laisser libre. Option : proposer + N jours d'après « N jours » dans les conditions |
| 10 | Total du contrat figé après modification de la variante | oui | reproduire. Afficher ⚠ dans le panneau si `CONTRACTAMOUNT ≠ time.AMOUNT2 + cost.AMOUNT2` [D] |
| 11 | Arrondi | `Formatter.round` symétrique | `dpRound` : **nouvelle fonction**, jamais `r05`/`r2` |
| 12 | TVA à 7.7 (gabarits 81 et 85, contrat 501) | données | afficher telles quelles ; proposer à Paulo de passer les gabarits à 8.1 ; **ne pas toucher au contrat** |
| 13 | Documents et PDF stockés | dossiers par objet | V1 : impression navigateur ; lot 7 : `/api/files` |
| 14 | QR : IBAN en minuscules, champs non rognés, libellé « Référence QR » pas mis à jour à l'ouverture, messages anglais, comparaison `double` stricte | oui | majuscules à la saisie, tout rogner, libellé calculé dès l'ouverture, messages en FR, comparaison au centime (écarts assumés et documentés) |
| 15 | QR : langue par défaut | Deutsch | **Français** |
| 16 | QR : calcul de la référence QRR | développement seulement | option « Calculer la référence QR » dans un réglage avancé, à partir du numéro de facture, avec accord de Paulo |
| 17 | Fautes d'origine (« planifification », « le services supplémentaires », « Montant invalid ») | présentes | corriger l'orthographe (aucune donnée en dépend) |
| 18 | Droits | `invoices` 12,0, 14,0, 14,1… | aucun contrôle (DeltaSub n'importe pas les droits) ; plus tard un droit dans l'Administrateur |
| 19 | **Ré-import depuis Deltaproject** | — | `importer_dans_deltasub.sh` → `import_deltaproject(--force)` **REMPLACE toute la base DeltaSub** (tous les enregistrements passent à null). Dès que le bureau saisit contrats, factures ou calculs dans DeltaSub, un ré-import les **efface**. Avant le lot 1 : ajouter au serveur une liste de collections protégées (`projectfee*`, `projectcontract`, `projectscheduledpayment`, `projectpayment`, `projectinvoice*`, `qrbill*`, `projectimplementation`) conservées par l'import, ou bloquer l'import s'il en existe ; et l'écrire dans `CLAUDE.md` |
| 20 | `STAFFRATE` comme prix du navigateur « Collaborateur » | taux du collaborateur | reproduire ; une option « tarif de l'affaire (`projectrate`) » serait une extension |
| 21 | Ancien document ou `.dpdoc` pour la facture | les deux | V1 : ancien modèle « Substances » (`tplPrint`, déjà présent, fidèle aux documents du bureau) ; `.dpdoc` au lot 7 |
| 22 | QR « ajouter sur la dernière page » | recouvre les 110 mm du bas sans contrôle | V1 : « nouvelle page à la fin » et « PDF séparé » ; dernière page seulement si le modèle réserve 110 mm |
| 23 | Ordre des positions créées par le transfert groupé | `HashMap`, sans ordre | tri par libellé de la clé (ou par numéro de phase) |

---

## Annexe A. Confrontation des 8 rapports : contradictions tranchées à la source

| # | Sujet | Affirmations en conflit | Tranché [P] |
|---|---|---|---|
| 1 | `SORTORDER` de l'encaissement créé depuis la facture | « module » : = nombre ; « factures_affaire » : + 1 | **+ 1** (`editProjectPayment@55-65`) |
| 2 | « Editer… » ou « Encaissement… » : qui crée et qui écrase | « module » : « Encaissement… » crée ; « factures_affaire » : « Editer… » crée et pré-remplit, « Encaissement… » écrase | **factures_affaire** : `$30` → `editProjectPayment(false)`, `$31` → `(true)` ; une création force la recopie |
| 3 | Règle OK du dialogue d'encaissement | « factures_affaire » : « date encaissement **OU** (désignation…) », dite défectueuse ; « contrats » : désignation ∧ montant ∧ (date encaissement ∨ (date facture ∧ montant 0)) | **contrats** (`ProjectPaymentDialog.checkGuards@0-105`) ; rien de défectueux |
| 4 | Les planifications génèrent-elles des factures ? | « manuel » §5.7 et « données » §5 : oui ; « factures_affaire » : non | **Non** : le seul `new db.ProjectInvoice` est dans `ProjectInvoiceDialog.newProjectInvoice` ; `ProjectScheduledPayment*` ne référence pas `db/ProjectInvoice` |
| 5 | Visible = non pour les tarifs mixtes du transfert | « factures_affaire » §8.4 et « données » f : Visible = non | **Visible = oui** : `newProjectInvoicePos@12-14` remet `setVisible(true)` (heures et frais) |
| 6 | Cas SIA de test | « données » §11 : B 551'400 → 1'678 h / 226'530 | **B = 1'000'000** ; 551'400 donne 1'053.29 h (`verif.py`) |
| 7 | Colonnes du tableau des contrats | « données » : Statut, Utilisateur, Total « en option » ; « manuel » : 8 colonnes | **12 colonnes, toutes visibles** (`TableType.all = 111111111111`) |
| 8 | Numérotation des factures | « manuel » : par affaire, commune aux contrats [D] | **aucune** : `NUMBER` est saisi librement |
| 9 | « Afficher les semaines » dans l'avancement | « manuel » : ajouté par la version installée | **absent du code** (bgrep `isChartByWeekOfYear` : 0 référence) |
| 10 | Questions de statut du Contrôle | « données » h : « Voulez-vous mettre le statut … à la facture ? » | inutilisées. En usage : `ProjectInvoiceDialog.askStatePaidMsg` « …dans Payée ? » et `InvoiceDialog.askStateSentMsg` « …dans « Envoyée » ? » |
| 11 | Droit d'accès au domaine Factures | « module » : sans le droit `projectInvoices` ; spec_3 : droit présumé | licence DELTAfaktura seule (`setMenuTable@281`) ; `projectInvoices` n'est **jamais testé** |
| 12 | Ordre de la barre des factures d'affaire | « factures_affaire » : …filtre, roue ; « qrbill » : …⚙, filtre | + ✎ QR − 📄▾ ⚙▾ ▼▾ libellé … recherche (GroupLayout horizontal) |
| 13 | « Nouveau document » du Contrôle | « données » h : dans le menu 📄 | dans le **panneau Documents** (`newInvoiceDocument`) ; 📄▾ ne contient que les 2 anciens documents |
| 14 | Filtre de statut par défaut (domaine) | non précisé | « Afficher tout » (null au constructeur @129-139), non mémorisé |
| 15 | « Contrat accessible » | « manuel » : libère la facturation [D] | filtre « Choix du contrat » de la facture **et** garde du bouton + quand un contrat non accessible est sélectionné (`ProjectInvoiceFrame.checkGuards@13-34`) |
| 16 | Préremplissage d'une nouvelle facture | « données » e : contrat → débiteur | confirmé : contrat = contrat sélectionné dans le filtre, débiteur = `contract.getContact()` (`newProjectInvoice@12-31`) |
| 17 | Bogue de l'OK de la variante | « calcul » seul | confirmé (`jOkButtonActionPerformed@109-136`) |
| 18 | Date « Facturé » figée | « factures_affaire » seul | confirmé (`TimeLogChargedDialog` @204-212 et OK @75-98) |
| 19 | Position unique du transfert | « factures_affaire » : 1 × h × total ; « données » : Q = Σ h, P = tarif | les deux sont justes, pour des modes différents : unique = Q 1, unité « h », prix = total arrondi (`newProjectInvoicePositions@101-169`) ; groupé = Σ h × tarif |
| 20 | Groupes de conditions et factures | spec_3 §2.13 : utilisés | **non** : seulement DELTAbauad et l'administration (tous les rapports concordent) |
| 21 | Intégrité | aucun rapport complet | `db.Integrity` : contact bloqué par débiteur, mandant ou en-tête ; phase et phase partielle bloquées par planification ou lignes de calcul ; **affaire non bloquée**, cascade (§2.6) |
| 22 | Politique « contrats et factures dans Facturation.html » | `spec_management.md` l.51, §6, §8 ; `DeltaSub.html` l.1547 | contraire à la demande et à la règle de séparation : **à remplacer** par les modules DeltaSub du présent cahier |

---

## Annexe B. Corrections à reporter

- **`outils_deltaproject/specs/spec_3_travail_affaire.md`**
  - **§2.10** : titres exacts (« Choix du mode de calcul des honoraires », « Editer le calcul des honoraires ») ; formule SIA et cas B = 1'000'000 ; pied choisi par ◀ ; rabais et escompte signés ; Dupliquer et Cahier absents ; SIA 1012/4 bogué.
  - **§2.11** : 12 colonnes ; ni tri ni recherche ; 📄 = ancien document ; vraie règle de suppression ; calcul de base ; `ISINVOICEABLE` = 0 par défaut ; accès par droit et non par licence.
  - **§2.12** : 10 colonnes, −1 = vide, pas d'« Afficher les semaines ».
  - **§2.13** : 8 colonnes de positions ; pas de « Type » ; « QR » par défaut ; pas de filtre « Ouverte » ; pas de génération depuis la planification ; encaissement lié au **contrat** ; conditions `INVOICECONDITION` hors factures ; menu contextuel et bouton QR.
  - **§3** : Contrôle avec « Toutes », « QR », « Montant TTC », « Encaissement ».
  - **§6 P3** : supprimer le renvoi à Facturation.
- **`spec_management.md`** : l.51, §6 et §8 à réécrire. Contrats et Factures deviennent réalisables sur les collections DeltaSub, après les lots 1 et 4.
- **`DeltaSub.html`** : l.1547-1548, supprimer les renvois « app Facturation ».

---

## À reproduire dans DeltaSub (par priorité)

1. **Supprimer les renvois à « l'app Facturation »** (`why`, l.1547-1548) et ne jamais lire ni appeler `Facturation.html`. Protéger d'abord les nouvelles collections contre le ré-import `--force` (§13 n° 19).
2. **Socle de calcul** (lot 0) : `dpRound` symétrique, `vatDefault()` = `setting.genVatRatePos` (8.1), `feeCond` (cascade, cible, propositions), `invCalc` / `invCheck` / `posDirty`, `prevInvoices` / `paidToDate` / `openContract`, getters `ctrTime/ctrCost/ctrVat`. Livrer avec les tests C1-C9 et F1-F11.
3. **Intégrité** (§2.6) dans `delContact`, `delOwner`, `cfgPhases`, `cfgActivities`, et cascade dans `delProject`.
4. **Domaine « Contrats honoraires »** (lot 1) :
   - 12 colonnes, ordre manuel, panneau de synthèse partagé ;
   - dialogue complet : validations, orange « sale », calcul de base créé au seul OK, suppression à 3 messages ;
   - « Editer les conditions » ;
   - affichage exact du contrat 501.
5. **Planifier les encaissements** et **Editer les encaissements** (cadenas, règle d'OK prouvée, suggestions d'échéance J+0/10/20/30/60).
6. **Domaine « Calcul des honoraires »** (lot 2) :
   - 2a : en-têtes, variantes, modes Global/Forfaitaire/Autre, lien contrat, 2 bogues corrigés ;
   - 2b : Coût de l'ouvrage (p, Tm, phases 3-5, JSON exact, CFC, import du devis, « Calculer » 3 parts) ;
   - 2c : temps effectif, frais, services supplémentaires, transferts de budget avec confirmation ;
   - anciens documents du calcul.
7. **Domaine « Avancement des prestations »** (lot 3) : tableau à 10 colonnes, dialogue (−1 = vide, 3 chiffres), graphique `mgChart` aux couleurs Modena.
8. **Domaine « Factures »** (lot 4) :
   - filtre des contrats, 14 colonnes, barre et menu contextuel ;
   - dialogue facture (suggestions, contrat accessible et « Reprendre le débiteur », questions Payée et écart) ;
   - positions à 8 genres, navigateur de gabarits, import depuis une facture ;
   - encaissement lié (`SORTORDER` n + 1, « Editer » ou « Encaissement ») ;
   - suppression en cascade ;
   - impression sur le modèle `projectInvoice` du groupe Substances (`tplPrint`), avec la question « Envoyée ».
9. **Administrateur** : « Gabarits de facturation » (`invoiceposgroup` / `invoicepos`, proposer de passer 81 et 85 à 8.1), « Taux de TVA » (`genVatRatePos`), puis « Comptes pour QR-facture ».
10. **FACTURES ▸ Contrôle de factures** (lot 5) : section dans `NAV` entre Tâches et Bâtiment, 5 catégories avec la borne d'état d'affaire 2-4 (sauf « Toutes »), 15 colonnes, ✎ · QR · 📄▾ (variante « avec requête de statut » en Planifiée seulement, puis rechargement) · ⚙ · recherche.
11. **Controlling ▸ « Transférer en facturation »** dans `ctlFlag` : choix d'une facture Planifiée, position unique ou groupée (6 modes pour les heures, 3 pour les frais), tarifs mixtes (Q 1, Visible = oui, message), même `DS.commit` que le marquage « Facturé ».
12. **QR-facture** (lot 6) : `qrbillaccount`, éditeur avec pré-remplissage prouvé, validations IBAN / QR-IBAN / QRR / SCOR / montant / adresses (tests Q1-Q6), encodeur QR JS en ligne, rendu SVG conforme (46 mm, croix suisse, polices, cadres, séparateurs), sortie « nouvelle page » et « PDF », colonne QR.
13. **Compléments** (lot 7) : stockage des documents et PDF (`/api/files`), `.dpdoc` jeux 1/2 (`mgPrint` généralisé), paramètres de l'ancien document (`TEMPLATEPROPERTIES`), import des positions depuis le calcul, révision de `spec_management` §6/§8 et vues Management Contrats et Factures.
14. **À soumettre à Paulo sans les implémenter d'office** : numérotation proposée des factures, échéance calculée, verrouillage des factures Payées, calcul automatique de la référence QR, correction de la TVA 7.7 des gabarits.
