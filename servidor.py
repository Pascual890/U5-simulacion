# Servidor local para ensayar la presentación sin que el navegador guarde
# versiones viejas de los archivos en caché.
# Uso (desde esta carpeta):  python servidor.py   y abrir http://localhost:8080

import http.server
import os

PUERTO = 8080


class SinCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


os.chdir(os.path.dirname(os.path.abspath(__file__)))
print(f"Presentación en http://localhost:{PUERTO}")
http.server.ThreadingHTTPServer(("", PUERTO), SinCache).serve_forever()
