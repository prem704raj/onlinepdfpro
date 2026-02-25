async function test() {
    const text = "Hello world this is a test";
    const urls = [
        `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&le=en`,
        `https://api.lingva.ml/api/v1/audio/en/${encodeURIComponent(text)}`
    ];

    for (const u of urls) {
        try {
            const res = await fetch(u);
            console.log(u.substring(0, 30), "Status:", res.status);
            if (res.ok) {
                const ab = await res.arrayBuffer();
                console.log("Length:", ab.byteLength);
            }
        } catch (e) {
            console.error(u.substring(0, 30), e.message);
        }
    }
}
test();
