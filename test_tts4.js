async function test() {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=Hello`;
    try {
        const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
        const json = await res.json();
        console.log("Success:", json.contents.substring(0, 50));
    } catch (e) {
        console.error(e.message);
    }
}
test();
