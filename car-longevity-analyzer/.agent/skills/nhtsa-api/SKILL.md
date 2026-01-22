---
name: NHTSA API Interaction
description: Instructions for interacting with the NHTSA API
---

# NHTSA API Integration Skill

## Description
This skill provides knowledge for integrating with the NHTSA (National Highway Traffic Safety Administration) APIs for vehicle data.

## When to Use
Activate this skill when the user needs to:
- Decode a VIN (Vehicle Identification Number)
- Look up vehicle recalls
- Fetch safety ratings
- Get complaint data for a vehicle

## API Endpoints

### VIN Decoding
GET https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/{VIN}?format=json
Returns: Year, Make, Model, Trim, Engine, Body Class, Drive Type, etc.

### Recalls by Vehicle
GET https://api.nhtsa.gov/recalls/recallsByVehicle?make={make}&model={model}&modelYear={year}
Returns: Campaign numbers, descriptions, remedies, completion status

### Complaints
GET https://api.nhtsa.gov/complaints/complaintsByVehicle?make={make}&model={model}&modelYear={year}
Returns: Component, summary, crash/fire/injury data, mileage

### Safety Ratings
GET https://api.nhtsa.gov/SafetyRatings/modelyear/{year}/make/{make}/model/{model}
Returns: Overall rating, frontal crash, side crash, rollover ratings

## Implementation Pattern
```typescript
// lib/nhtsa.ts
const NHTSA_VIN_API = 'https://vpic.nhtsa.dot.gov/api/vehicles';
const NHTSA_SAFETY_API = 'https://api.nhtsa.gov';

export async function decodeVin(vin: string) {
  const response = await fetch(
    `${NHTSA_VIN_API}/decodevin/${vin}?format=json`
  );
  const data = await response.json();
  
  // Parse the Results array into a clean object
  const results = data.Results.reduce((acc: any, item: any) => {
    if (item.Value && item.Value !== 'Not Applicable') {
      acc[item.Variable] = item.Value;
    }
    return acc;
  }, {});
  
  return {
    vin,
    year: parseInt(results['Model Year']),
    make: results['Make'],
    model: results['Model'],
    trim: results['Trim'],
    engine: results['Displacement (L)'] + 'L ' + results['Engine Number of Cylinders'] + '-Cylinder',
    drivetrain: results['Drive Type'],
    bodyClass: results['Body Class'],
  };
}

export async function getRecalls(make: string, model: string, year: number) {
  const response = await fetch(
    `${NHTSA_SAFETY_API}/recalls/recallsByVehicle?make=${make}&model=${model}&modelYear=${year}`
  );
  const data = await response.json();
  return data.results || [];
}

export async function getComplaints(make: string, model: string, year: number) {
  const response = await fetch(
    `${NHTSA_SAFETY_API}/complaints/complaintsByVehicle?make=${make}&model=${model}&modelYear=${year}`
  );
  const data = await response.json();
  return data.results || [];
}
```

## Error Handling
- Invalid VIN returns empty Results array
- Rate limit: None documented, but add 100ms delay between calls
- Cache responses for same VIN (data doesn't change)
