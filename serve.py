import os, http.server, socketserver
os.chdir("/Volumes/SUBSTANCES ARCHITECTES/00-ADMIN/01-FACTURATION/99_applucation facturation in progress")
class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_GET(self):
        if self.path == '/': self.path = '/Facturation.html'
        return super().do_GET()
with socketserver.TCPServer(("", 7654), Handler) as httpd:
    httpd.serve_forever()
