async function testListingApi() {
    console.log('Testing Listing Analysis API...');

    const payload = {
        // A sample listing text that mentions the car but is a bit messy
        listingText: `
      FOR SALE: 2018 Honda Civic EX. Runs great, just needs a new home. 
      About 65k miles on it. Clean title in hand. 
      Asking $18,500 obo. No low ballers.
      Recent oil change and new tires. 
      Small dent on rear bumper but otherwise perfect condition.
    `
        // Intentionally omitting askingPrice and mileage fields to test extraction
    };

    try {
        const response = await fetch('http://localhost:3000/api/analyze/listing', {
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

testListingApi();
