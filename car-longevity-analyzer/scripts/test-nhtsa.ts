import { getRecalls, getComplaints, getSafetyRatings } from '../lib/nhtsa';

async function test() {
    console.log('Testing NHTSA API...');

    const make = 'Toyota';
    const model = 'Camry';
    const year = 2020;

    console.log(`\nFetching recalls for ${year} ${make} ${model}...`);
    const recalls = await getRecalls(make, model, year);
    console.log(`Found ${recalls.length} recalls.`);
    if (recalls.length > 0) {
        console.log('Sample recall:', recalls[0].Summary.substring(0, 100) + '...');
    }

    console.log(`\nFetching complaints for ${year} ${make} ${model}...`);
    const complaints = await getComplaints(make, model, year);
    console.log(`Found ${complaints.length} complaints.`);

    console.log(`\nFetching safety ratings for ${year} ${make} ${model}...`);
    const ratings = await getSafetyRatings(make, model, year);
    console.log('Ratings:', ratings);

    console.log('\nDone.');
}

test();
