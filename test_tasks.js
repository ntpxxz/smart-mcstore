async function testTasks() {
    try {
        const response = await fetch('http://localhost:3000/api/tasks');
        const data = await response.json();
        console.log('Status:', response.status);
        if (Array.isArray(data)) {
            console.log('Count:', data.length);
            if (data.length > 0) {
                console.log('First task:', JSON.stringify(data[0], null, 2));
            }
        } else {
            console.log('Data:', data);
        }
    } catch (err) {
        console.error('Fetch error:', err.message);
    }
}

testTasks();
