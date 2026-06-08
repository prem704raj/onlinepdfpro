import modal

app = modal.App("onlinepdfpro-bg-remover")

image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "torch==2.1.2",
        "torchvision==0.16.2",
        "transformers==4.38.2",
        "pillow",
        "fastapi[standard]",
        "python-multipart"
    )
)

with image.imports():
    from transformers import pipeline
    from PIL import Image
    import io

@app.cls(gpu="a10g", image=image, min_containers=1)
class Model:
    @modal.enter()
    def load_model(self):
        self.pipe = pipeline("image-segmentation", model="ZhengPeng7/BiRefNet", trust_remote_code=True)
    
    @modal.method()
    def process_image(self, image_bytes: bytes) -> bytes:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        MAX_DIM = 2048
        if img.width > MAX_DIM or img.height > MAX_DIM:
            img.thumbnail((MAX_DIM, MAX_DIM))
            
        result = self.pipe(img)
        
        if isinstance(result, Image.Image):
            out_img = result
        elif isinstance(result, list):
            out_img = result[0].get('mask', img)
        else:
            out_img = result
            
        out_bytes = io.BytesIO()
        out_img.save(out_bytes, format="PNG")
        return out_bytes.getvalue()

@app.function(image=image)
@modal.asgi_app()
def fastapi_app():
    from fastapi import FastAPI, UploadFile, File, Response
    from fastapi.middleware.cors import CORSMiddleware
    
    web_app = FastAPI()

    web_app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @web_app.post("/remove")
    async def remove_bg(file: UploadFile = File(...)):
        image_bytes = await file.read()
        model = Model()
        out_bytes = model.process_image.remote(image_bytes)
        return Response(content=out_bytes, media_type="image/png")

    return web_app
