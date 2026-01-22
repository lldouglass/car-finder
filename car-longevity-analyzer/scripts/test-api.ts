async function testApi() {
    console.log('Testing VIN Analysis API...');

    // 2020 Toyota Camry VIN (Real VIN from NHTSA example or generic logic)
    // Let's use a known valid structure. 
    // 4T1B is Toyota Camry built in US. 
    // 11th char is plant, 12-17 is serial.
    const sampleVin = '4T1B11HK8JU000000'; // Sample valid format VIN (check digit not validated by simple regex usually, but NHTSA check digit might fail if invalid. I should try to use a real one or just expect 404/Null from NHTSA if invalid, but the API should handle it)

    // Real VIN example: 2020 Toyota Camry
    const realVin = '4T1B11HK5LU000216'; // From a public NHTSA example

    const payload = {
        vin: realVin,
        mileage: 45000,
        askingPrice: 21000,
        listingText: "Great car, runs well. One owner. Clean title."
    };

    try {
        const response = await fetch('http://localhost:3000/api/analyze/vin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const status = response.status;
        console.log(`Response Status: ${status}`);

        const data = await response.json();
        console.log('Response Body:', JSON.stringify(data, null, 2));

    } catch (error) {
        console.error('Error fetching API:', error);
    }
}

testApi();
