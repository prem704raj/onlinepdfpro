import modal

app = modal.App("inspect-marker")
image = modal.Image.debian_slim(python_version="3.12").pip_install("marker-pdf==1.9.3", "torch")

@app.function(image=image)
def test_marker_init():
    import inspect
    from marker.converters.pdf import PdfConverter
    from marker.config.parser import ConfigParser
    print("PdfConverter init signature:", inspect.signature(PdfConverter.__init__))
    cp = ConfigParser({"output_format": "html"})
    print("get_processors():", cp.get_processors())
    print("get_renderer():", cp.get_renderer())

@app.local_entrypoint()
def main():
    test_marker_init.remote()
