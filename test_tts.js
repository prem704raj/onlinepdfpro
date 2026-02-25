async function test() {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=Hello`;
    const proxies = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        `https://api.allorigins.ml/raw?url=${encodeURIComponent(url)}`,
        `https://cors-anywhere.herokuapp.com/${url}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
    ];

    for (const p of proxies) {
        try {
            const res = await fetch(p);
            console.log(p.substring(0, 30), "Status:", res.status);
            const ab = await res.arrayBuffer();
            console.log("Length:", ab.byteLength);
        } catch (e) {
            console.error(p.substring(0, 30), e.message);
        }
    }
}
test();
