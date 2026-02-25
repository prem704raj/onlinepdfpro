async function test() {
    const text = "Hello world";
    try {
        const res = await fetch('https://api.soundoftext.com/sounds', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ engine: 'Google', data: { text: text, voice: 'en-US' } })
        });
        const json = await res.json();
        console.log("POST:", json);
        if (json.success) {
            const id = json.id;
            // Wait for it
            await new Promise(r => setTimeout(r, 1000));
            const res2 = await fetch(`https://api.soundoftext.com/sounds/${id}`);
            const json2 = await res2.json();
            console.log("GET:", json2);
        }
    } catch (e) {
        console.error(e.message);
    }
}
test();
