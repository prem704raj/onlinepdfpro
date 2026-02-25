async function test() {
    try {
        const res = await fetch('https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=en&q=Hello');
        console.log("Status:", res.status);
        console.log("Headers:", res.headers.get('access-control-allow-origin'));
    } catch (e) {
        console.error(e.message);
    }
}
test();
