export interface ExploreCar {
  make: string;
  model: string;
  year: number;
  reliabilityScore: number;
  nhtsaComplaints: number;
  topIssueCategory: string;
  safetyRating: number;
  type: "sedan" | "suv" | "truck" | "coupe" | "hatchback" | "minivan";
}

export const exploreCars: ExploreCar[] = [
  // Toyota
  { make: "Toyota", model: "Camry", year: 2024, reliabilityScore: 9, nhtsaComplaints: 12, topIssueCategory: "None", safetyRating: 5, type: "sedan" },
  { make: "Toyota", model: "Camry", year: 2023, reliabilityScore: 9, nhtsaComplaints: 34, topIssueCategory: "None", safetyRating: 5, type: "sedan" },
  { make: "Toyota", model: "Camry", year: 2022, reliabilityScore: 9, nhtsaComplaints: 56, topIssueCategory: "Electrical", safetyRating: 5, type: "sedan" },
  { make: "Toyota", model: "Camry", year: 2021, reliabilityScore: 9, nhtsaComplaints: 78, topIssueCategory: "None", safetyRating: 5, type: "sedan" },
  { make: "Toyota", model: "Camry", year: 2020, reliabilityScore: 9, nhtsaComplaints: 98, topIssueCategory: "None", safetyRating: 5, type: "sedan" },
  { make: "Toyota", model: "Camry", year: 2019, reliabilityScore: 8, nhtsaComplaints: 134, topIssueCategory: "Electrical", safetyRating: 5, type: "sedan" },
  { make: "Toyota", model: "Camry", year: 2018, reliabilityScore: 8, nhtsaComplaints: 167, topIssueCategory: "Electrical", safetyRating: 5, type: "sedan" },
  { make: "Toyota", model: "Camry", year: 2015, reliabilityScore: 9, nhtsaComplaints: 189, topIssueCategory: "None", safetyRating: 5, type: "sedan" },
  { make: "Toyota", model: "Camry", year: 2012, reliabilityScore: 8, nhtsaComplaints: 245, topIssueCategory: "None", safetyRating: 5, type: "sedan" },
  { make: "Toyota", model: "Camry", year: 2009, reliabilityScore: 7, nhtsaComplaints: 412, topIssueCategory: "Engine", safetyRating: 4, type: "sedan" },
  { make: "Toyota", model: "Camry", year: 2007, reliabilityScore: 6, nhtsaComplaints: 621, topIssueCategory: "Engine", safetyRating: 4, type: "sedan" },

  { make: "Toyota", model: "Corolla", year: 2024, reliabilityScore: 9, nhtsaComplaints: 8, topIssueCategory: "None", safetyRating: 5, type: "sedan" },
  { make: "Toyota", model: "Corolla", year: 2023, reliabilityScore: 9, nhtsaComplaints: 23, topIssueCategory: "None", safetyRating: 5, type: "sedan" },
  { make: "Toyota", model: "Corolla", year: 2022, reliabilityScore: 9, nhtsaComplaints: 45, topIssueCategory: "None", safetyRating: 5, type: "sedan" },
  { make: "Toyota", model: "Corolla", year: 2020, reliabilityScore: 9, nhtsaComplaints: 67, topIssueCategory: "None", safetyRating: 5, type: "sedan" },
  { make: "Toyota", model: "Corolla", year: 2018, reliabilityScore: 9, nhtsaComplaints: 89, topIssueCategory: "None", safetyRating: 5, type: "sedan" },
  { make: "Toyota", model: "Corolla", year: 2015, reliabilityScore: 9, nhtsaComplaints: 134, topIssueCategory: "None", safetyRating: 4, type: "sedan" },
  { make: "Toyota", model: "Corolla", year: 2012, reliabilityScore: 9, nhtsaComplaints: 178, topIssueCategory: "None", safetyRating: 4, type: "sedan" },
  { make: "Toyota", model: "Corolla", year: 2010, reliabilityScore: 8, nhtsaComplaints: 312, topIssueCategory: "Steering", safetyRating: 4, type: "sedan" },
  { make: "Toyota", model: "Corolla", year: 2009, reliabilityScore: 7, nhtsaComplaints: 567, topIssueCategory: "Steering", safetyRating: 4, type: "sedan" },

  { make: "Toyota", model: "RAV4", year: 2024, reliabilityScore: 8, nhtsaComplaints: 14, topIssueCategory: "None", safetyRating: 5, type: "suv" },
  { make: "Toyota", model: "RAV4", year: 2023, reliabilityScore: 8, nhtsaComplaints: 45, topIssueCategory: "None", safetyRating: 5, type: "suv" },
  { make: "Toyota", model: "RAV4", year: 2022, reliabilityScore: 8, nhtsaComplaints: 67, topIssueCategory: "None", safetyRating: 5, type: "suv" },
  { make: "Toyota", model: "RAV4", year: 2021, reliabilityScore: 8, nhtsaComplaints: 98, topIssueCategory: "None", safetyRating: 5, type: "suv" },
  { make: "Toyota", model: "RAV4", year: 2019, reliabilityScore: 8, nhtsaComplaints: 198, topIssueCategory: "Fuel System", safetyRating: 5, type: "suv" },
  { make: "Toyota", model: "RAV4", year: 2016, reliabilityScore: 8, nhtsaComplaints: 234, topIssueCategory: "None", safetyRating: 5, type: "suv" },
  { make: "Toyota", model: "RAV4", year: 2013, reliabilityScore: 7, nhtsaComplaints: 289, topIssueCategory: "Electrical", safetyRating: 4, type: "suv" },
  { make: "Toyota", model: "RAV4", year: 2008, reliabilityScore: 6, nhtsaComplaints: 456, topIssueCategory: "Engine", safetyRating: 4, type: "suv" },

  { make: "Toyota", model: "Tacoma", year: 2024, reliabilityScore: 8, nhtsaComplaints: 18, topIssueCategory: "None", safetyRating: 4, type: "truck" },
  { make: "Toyota", model: "Tacoma", year: 2022, reliabilityScore: 8, nhtsaComplaints: 45, topIssueCategory: "None", safetyRating: 4, type: "truck" },
  { make: "Toyota", model: "Tacoma", year: 2020, reliabilityScore: 8, nhtsaComplaints: 89, topIssueCategory: "Transmission", safetyRating: 4, type: "truck" },
  { make: "Toyota", model: "Tacoma", year: 2018, reliabilityScore: 8, nhtsaComplaints: 134, topIssueCategory: "Transmission", safetyRating: 4, type: "truck" },
  { make: "Toyota", model: "Tacoma", year: 2016, reliabilityScore: 7, nhtsaComplaints: 456, topIssueCategory: "Transmission", safetyRating: 4, type: "truck" },

  { make: "Toyota", model: "Highlander", year: 2024, reliabilityScore: 8, nhtsaComplaints: 21, topIssueCategory: "None", safetyRating: 5, type: "suv" },
  { make: "Toyota", model: "Highlander", year: 2022, reliabilityScore: 8, nhtsaComplaints: 56, topIssueCategory: "None", safetyRating: 5, type: "suv" },
  { make: "Toyota", model: "Highlander", year: 2020, reliabilityScore: 8, nhtsaComplaints: 87, topIssueCategory: "None", safetyRating: 5, type: "suv" },
  { make: "Toyota", model: "Highlander", year: 2017, reliabilityScore: 8, nhtsaComplaints: 156, topIssueCategory: "None", safetyRating: 5, type: "suv" },
  { make: "Toyota", model: "Highlander", year: 2014, reliabilityScore: 7, nhtsaComplaints: 234, topIssueCategory: "Electrical", safetyRating: 5, type: "suv" },

  // Honda
  { make: "Honda", model: "Civic", year: 2024, reliabilityScore: 9, nhtsaComplaints: 15, topIssueCategory: "None", safetyRating: 5, type: "sedan" },
  { make: "Honda", model: "Civic", year: 2023, reliabilityScore: 9, nhtsaComplaints: 34, topIssueCategory: "None", safetyRating: 5, type: "sedan" },
  { make: "Honda", model: "Civic", year: 2022, reliabilityScore: 9, nhtsaComplaints: 56, topIssueCategory: "None", safetyRating: 5, type: "sedan" },
  { make: "Honda", model: "Civic", year: 2021, reliabilityScore: 8, nhtsaComplaints: 98, topIssueCategory: "Electrical", safetyRating: 5, type: "sedan" },
  { make: "Honda", model: "Civic", year: 2020, reliabilityScore: 8, nhtsaComplaints: 123, topIssueCategory: "None", safetyRating: 5, type: "sedan" },
  { make: "Honda", model: "Civic", year: 2018, reliabilityScore: 7, nhtsaComplaints: 234, topIssueCategory: "Engine", safetyRating: 5, type: "sedan" },
  { make: "Honda", model: "Civic", year: 2016, reliabilityScore: 7, nhtsaComplaints: 423, topIssueCategory: "Engine", safetyRating: 5, type: "sedan" },
  { make: "Honda", model: "Civic", year: 2014, reliabilityScore: 8, nhtsaComplaints: 198, topIssueCategory: "None", safetyRating: 4, type: "sedan" },
  { make: "Honda", model: "Civic", year: 2012, reliabilityScore: 7, nhtsaComplaints: 287, topIssueCategory: "Electrical", safetyRating: 4, type: "sedan" },
  { make: "Honda", model: "Civic", year: 2009, reliabilityScore: 7, nhtsaComplaints: 412, topIssueCategory: "Engine", safetyRating: 4, type: "sedan" },

  { make: "Honda", model: "CR-V", year: 2024, reliabilityScore: 8, nhtsaComplaints: 12, topIssueCategory: "None", safetyRating: 5, type: "suv" },
  { make: "Honda", model: "CR-V", year: 2023, reliabilityScore: 8, nhtsaComplaints: 34, topIssueCategory: "None", safetyRating: 5, type: "suv" },
  { make: "Honda", model: "CR-V", year: 2022, reliabilityScore: 8, nhtsaComplaints: 56, topIssueCategory: "None", safetyRating: 5, type: "suv" },
  { make: "Honda", model: "CR-V", year: 2021, reliabilityScore: 7, nhtsaComplaints: 134, topIssueCategory: "Engine", safetyRating: 5, type: "suv" },
  { make: "Honda", model: "CR-V", year: 2019, reliabilityScore: 7, nhtsaComplaints: 234, topIssueCategory: "Engine", safetyRating: 5, type: "suv" },
  { make: "Honda", model: "CR-V", year: 2017, reliabilityScore: 6, nhtsaComplaints: 456, topIssueCategory: "Engine", safetyRating: 5, type: "suv" },
  { make: "Honda", model: "CR-V", year: 2015, reliabilityScore: 8, nhtsaComplaints: 178, topIssueCategory: "None", safetyRating: 5, type: "suv" },
  { make: "Honda", model: "CR-V", year: 2012, reliabilityScore: 8, nhtsaComplaints: 198, topIssueCategory: "None", safetyRating: 4, type: "suv" },

  { make: "Honda", model: "Accord", year: 2024, reliabilityScore: 8, nhtsaComplaints: 18, topIssueCategory: "None", safetyRating: 5, type: "sedan" },
  { make: "Honda", model: "Accord", year: 2022, reliabilityScore: 8, nhtsaComplaints: 45, topIssueCategory: "None", safetyRating: 5, type: "sedan" },
  { make: "Honda", model: "Accord", year: 2020, reliabilityScore: 8, nhtsaComplaints: 89, topIssueCategory: "None", safetyRating: 5, type: "sedan" },
  { make: "Honda", model: "Accord", year: 2018, reliabilityScore: 8, nhtsaComplaints: 145, topIssueCategory: "Electrical", safetyRating: 5, type: "sedan" },
  { make: "Honda", model: "Accord", year: 2015, reliabilityScore: 8, nhtsaComplaints: 198, topIssueCategory: "None", safetyRating: 5, type: "sedan" },
  { make: "Honda", model: "Accord", year: 2012, reliabilityScore: 8, nhtsaComplaints: 267, topIssueCategory: "None", safetyRating: 4, type: "sedan" },

  // Mazda
  { make: "Mazda", model: "CX-5", year: 2024, reliabilityScore: 9, nhtsaComplaints: 11, topIssueCategory: "None", safetyRating: 5, type: "suv" },
  { make: "Mazda", model: "CX-5", year: 2023, reliabilityScore: 9, nhtsaComplaints: 28, topIssueCategory: "None", safetyRating: 5, type: "suv" },
  { make: "Mazda", model: "CX-5", year: 2022, reliabilityScore: 9, nhtsaComplaints: 45, topIssueCategory: "None", safetyRating: 5, type: "suv" },
  { make: "Mazda", model: "CX-5", year: 2021, reliabilityScore: 9, nhtsaComplaints: 67, topIssueCategory: "None", safetyRating: 5, type: "suv" },
  { make: "Mazda", model: "CX-5", year: 2020, reliabilityScore: 8, nhtsaComplaints: 89, topIssueCategory: "None", safetyRating: 5, type: "suv" },
  { make: "Mazda", model: "CX-5", year: 2018, reliabilityScore: 8, nhtsaComplaints: 134, topIssueCategory: "None", safetyRating: 5, type: "suv" },
  { make: "Mazda", model: "CX-5", year: 2016, reliabilityScore: 7, nhtsaComplaints: 187, topIssueCategory: "Electrical", safetyRating: 5, type: "suv" },
  { make: "Mazda", model: "CX-5", year: 2014, reliabilityScore: 7, nhtsaComplaints: 214, topIssueCategory: "None", safetyRating: 4, type: "suv" },

  { make: "Mazda", model: "Mazda3", year: 2024, reliabilityScore: 9, nhtsaComplaints: 9, topIssueCategory: "None", safetyRating: 5, type: "sedan" },
  { make: "Mazda", model: "Mazda3", year: 2022, reliabilityScore: 9, nhtsaComplaints: 34, topIssueCategory: "None", safetyRating: 5, type: "sedan" },
  { make: "Mazda", model: "Mazda3", year: 2020, reliabilityScore: 8, nhtsaComplaints: 56, topIssueCategory: "None", safetyRating: 5, type: "sedan" },
  { make: "Mazda", model: "Mazda3", year: 2018, reliabilityScore: 8, nhtsaComplaints: 89, topIssueCategory: "None", safetyRating: 5, type: "sedan" },
  { make: "Mazda", model: "Mazda3", year: 2016, reliabilityScore: 8, nhtsaComplaints: 123, topIssueCategory: "None", safetyRating: 5, type: "sedan" },
  { make: "Mazda", model: "Mazda3", year: 2014, reliabilityScore: 8, nhtsaComplaints: 156, topIssueCategory: "None", safetyRating: 4, type: "sedan" },
  { make: "Mazda", model: "Mazda3", year: 2012, reliabilityScore: 8, nhtsaComplaints: 178, topIssueCategory: "None", safetyRating: 4, type: "sedan" },

  { make: "Mazda", model: "CX-50", year: 2024, reliabilityScore: 8, nhtsaComplaints: 14, topIssueCategory: "None", safetyRating: 5, type: "suv" },
  { make: "Mazda", model: "CX-50", year: 2023, reliabilityScore: 8, nhtsaComplaints: 34, topIssueCategory: "None", safetyRating: 5, type: "suv" },

  // Subaru
  { make: "Subaru", model: "Outback", year: 2024, reliabilityScore: 7, nhtsaComplaints: 34, topIssueCategory: "None", safetyRating: 5, type: "suv" },
  { make: "Subaru", model: "Outback", year: 2022, reliabilityScore: 7, nhtsaComplaints: 78, topIssueCategory: "Electrical", safetyRating: 5, type: "suv" },
  { make: "Subaru", model: "Outback", year: 2020, reliabilityScore: 6, nhtsaComplaints: 198, topIssueCategory: "Electrical", safetyRating: 5, type: "suv" },
  { make: "Subaru", model: "Outback", year: 2018, reliabilityScore: 7, nhtsaComplaints: 156, topIssueCategory: "Transmission", safetyRating: 5, type: "suv" },
  { make: "Subaru", model: "Outback", year: 2016, reliabilityScore: 6, nhtsaComplaints: 267, topIssueCategory: "Engine", safetyRating: 5, type: "suv" },

  { make: "Subaru", model: "Forester", year: 2024, reliabilityScore: 7, nhtsaComplaints: 23, topIssueCategory: "None", safetyRating: 5, type: "suv" },
  { make: "Subaru", model: "Forester", year: 2022, reliabilityScore: 7, nhtsaComplaints: 67, topIssueCategory: "None", safetyRating: 5, type: "suv" },
  { make: "Subaru", model: "Forester", year: 2020, reliabilityScore: 7, nhtsaComplaints: 123, topIssueCategory: "Transmission", safetyRating: 5, type: "suv" },
  { make: "Subaru", model: "Forester", year: 2018, reliabilityScore: 7, nhtsaComplaints: 178, topIssueCategory: "Engine", safetyRating: 5, type: "suv" },
  { make: "Subaru", model: "Forester", year: 2015, reliabilityScore: 6, nhtsaComplaints: 298, topIssueCategory: "Engine", safetyRating: 4, type: "suv" },

  // Ford
  { make: "Ford", model: "F-150", year: 2024, reliabilityScore: 7, nhtsaComplaints: 34, topIssueCategory: "None", safetyRating: 5, type: "truck" },
  { make: "Ford", model: "F-150", year: 2022, reliabilityScore: 6, nhtsaComplaints: 123, topIssueCategory: "Engine", safetyRating: 5, type: "truck" },
  { make: "Ford", model: "F-150", year: 2021, reliabilityScore: 5, nhtsaComplaints: 345, topIssueCategory: "Engine", safetyRating: 5, type: "truck" },
  { make: "Ford", model: "F-150", year: 2019, reliabilityScore: 6, nhtsaComplaints: 267, topIssueCategory: "Transmission", safetyRating: 5, type: "truck" },
  { make: "Ford", model: "F-150", year: 2017, reliabilityScore: 5, nhtsaComplaints: 456, topIssueCategory: "Engine", safetyRating: 5, type: "truck" },
  { make: "Ford", model: "F-150", year: 2015, reliabilityScore: 5, nhtsaComplaints: 567, topIssueCategory: "Transmission", safetyRating: 4, type: "truck" },

  { make: "Ford", model: "Escape", year: 2023, reliabilityScore: 6, nhtsaComplaints: 56, topIssueCategory: "Electrical", safetyRating: 5, type: "suv" },
  { make: "Ford", model: "Escape", year: 2021, reliabilityScore: 5, nhtsaComplaints: 178, topIssueCategory: "Transmission", safetyRating: 5, type: "suv" },
  { make: "Ford", model: "Escape", year: 2019, reliabilityScore: 5, nhtsaComplaints: 234, topIssueCategory: "Transmission", safetyRating: 5, type: "suv" },
  { make: "Ford", model: "Escape", year: 2017, reliabilityScore: 5, nhtsaComplaints: 345, topIssueCategory: "Transmission", safetyRating: 4, type: "suv" },
  { make: "Ford", model: "Escape", year: 2014, reliabilityScore: 4, nhtsaComplaints: 678, topIssueCategory: "Engine", safetyRating: 4, type: "suv" },

  { make: "Ford", model: "Focus", year: 2018, reliabilityScore: 6, nhtsaComplaints: 67, topIssueCategory: "Electrical", safetyRating: 5, type: "sedan" },
  { make: "Ford", model: "Focus", year: 2016, reliabilityScore: 2, nhtsaComplaints: 1234, topIssueCategory: "Transmission", safetyRating: 5, type: "sedan" },
  { make: "Ford", model: "Focus", year: 2014, reliabilityScore: 2, nhtsaComplaints: 1567, topIssueCategory: "Transmission", safetyRating: 4, type: "sedan" },
  { make: "Ford", model: "Focus", year: 2012, reliabilityScore: 2, nhtsaComplaints: 1890, topIssueCategory: "Transmission", safetyRating: 4, type: "sedan" },

  // Chevrolet
  { make: "Chevrolet", model: "Silverado 1500", year: 2024, reliabilityScore: 6, nhtsaComplaints: 34, topIssueCategory: "None", safetyRating: 5, type: "truck" },
  { make: "Chevrolet", model: "Silverado 1500", year: 2022, reliabilityScore: 6, nhtsaComplaints: 123, topIssueCategory: "Electrical", safetyRating: 5, type: "truck" },
  { make: "Chevrolet", model: "Silverado 1500", year: 2020, reliabilityScore: 5, nhtsaComplaints: 345, topIssueCategory: "Transmission", safetyRating: 5, type: "truck" },
  { make: "Chevrolet", model: "Silverado 1500", year: 2018, reliabilityScore: 5, nhtsaComplaints: 412, topIssueCategory: "Brakes", safetyRating: 4, type: "truck" },
  { make: "Chevrolet", model: "Silverado 1500", year: 2016, reliabilityScore: 5, nhtsaComplaints: 456, topIssueCategory: "Engine", safetyRating: 4, type: "truck" },

  { make: "Chevrolet", model: "Equinox", year: 2024, reliabilityScore: 7, nhtsaComplaints: 23, topIssueCategory: "None", safetyRating: 5, type: "suv" },
  { make: "Chevrolet", model: "Equinox", year: 2022, reliabilityScore: 7, nhtsaComplaints: 67, topIssueCategory: "None", safetyRating: 5, type: "suv" },
  { make: "Chevrolet", model: "Equinox", year: 2020, reliabilityScore: 6, nhtsaComplaints: 145, topIssueCategory: "Engine", safetyRating: 5, type: "suv" },
  { make: "Chevrolet", model: "Equinox", year: 2018, reliabilityScore: 5, nhtsaComplaints: 289, topIssueCategory: "Engine", safetyRating: 5, type: "suv" },
  { make: "Chevrolet", model: "Equinox", year: 2015, reliabilityScore: 4, nhtsaComplaints: 456, topIssueCategory: "Engine", safetyRating: 4, type: "suv" },

  // Nissan
  { make: "Nissan", model: "Altima", year: 2024, reliabilityScore: 6, nhtsaComplaints: 45, topIssueCategory: "None", safetyRating: 5, type: "sedan" },
  { make: "Nissan", model: "Altima", year: 2022, reliabilityScore: 5, nhtsaComplaints: 134, topIssueCategory: "Transmission", safetyRating: 5, type: "sedan" },
  { make: "Nissan", model: "Altima", year: 2020, reliabilityScore: 5, nhtsaComplaints: 198, topIssueCategory: "Transmission", safetyRating: 5, type: "sedan" },
  { make: "Nissan", model: "Altima", year: 2018, reliabilityScore: 4, nhtsaComplaints: 345, topIssueCategory: "Transmission", safetyRating: 5, type: "sedan" },
  { make: "Nissan", model: "Altima", year: 2016, reliabilityScore: 3, nhtsaComplaints: 567, topIssueCategory: "Transmission", safetyRating: 5, type: "sedan" },
  { make: "Nissan", model: "Altima", year: 2014, reliabilityScore: 3, nhtsaComplaints: 789, topIssueCategory: "Transmission", safetyRating: 4, type: "sedan" },
  { make: "Nissan", model: "Altima", year: 2013, reliabilityScore: 3, nhtsaComplaints: 1234, topIssueCategory: "Transmission", safetyRating: 4, type: "sedan" },

  { make: "Nissan", model: "Rogue", year: 2024, reliabilityScore: 6, nhtsaComplaints: 34, topIssueCategory: "None", safetyRating: 5, type: "suv" },
  { make: "Nissan", model: "Rogue", year: 2022, reliabilityScore: 6, nhtsaComplaints: 89, topIssueCategory: "Electrical", safetyRating: 5, type: "suv" },
  { make: "Nissan", model: "Rogue", year: 2020, reliabilityScore: 5, nhtsaComplaints: 198, topIssueCategory: "Transmission", safetyRating: 5, type: "suv" },
  { make: "Nissan", model: "Rogue", year: 2018, reliabilityScore: 4, nhtsaComplaints: 345, topIssueCategory: "Transmission", safetyRating: 5, type: "suv" },
  { make: "Nissan", model: "Rogue", year: 2015, reliabilityScore: 4, nhtsaComplaints: 567, topIssueCategory: "Transmission", safetyRating: 4, type: "suv" },

  // Hyundai
  { make: "Hyundai", model: "Tucson", year: 2024, reliabilityScore: 7, nhtsaComplaints: 23, topIssueCategory: "None", safetyRating: 5, type: "suv" },
  { make: "Hyundai", model: "Tucson", year: 2022, reliabilityScore: 6, nhtsaComplaints: 98, topIssueCategory: "Electrical", safetyRating: 5, type: "suv" },
  { make: "Hyundai", model: "Tucson", year: 2020, reliabilityScore: 6, nhtsaComplaints: 156, topIssueCategory: "Engine", safetyRating: 5, type: "suv" },
  { make: "Hyundai", model: "Tucson", year: 2018, reliabilityScore: 4, nhtsaComplaints: 456, topIssueCategory: "Engine", safetyRating: 5, type: "suv" },
  { make: "Hyundai", model: "Tucson", year: 2016, reliabilityScore: 4, nhtsaComplaints: 678, topIssueCategory: "Engine", safetyRating: 4, type: "suv" },

  { make: "Hyundai", model: "Elantra", year: 2024, reliabilityScore: 7, nhtsaComplaints: 18, topIssueCategory: "None", safetyRating: 5, type: "sedan" },
  { make: "Hyundai", model: "Elantra", year: 2022, reliabilityScore: 7, nhtsaComplaints: 56, topIssueCategory: "None", safetyRating: 5, type: "sedan" },
  { make: "Hyundai", model: "Elantra", year: 2020, reliabilityScore: 7, nhtsaComplaints: 89, topIssueCategory: "None", safetyRating: 5, type: "sedan" },
  { make: "Hyundai", model: "Elantra", year: 2018, reliabilityScore: 6, nhtsaComplaints: 178, topIssueCategory: "Engine", safetyRating: 5, type: "sedan" },
  { make: "Hyundai", model: "Elantra", year: 2015, reliabilityScore: 5, nhtsaComplaints: 345, topIssueCategory: "Engine", safetyRating: 4, type: "sedan" },

  { make: "Hyundai", model: "Sonata", year: 2024, reliabilityScore: 7, nhtsaComplaints: 23, topIssueCategory: "None", safetyRating: 5, type: "sedan" },
  { make: "Hyundai", model: "Sonata", year: 2022, reliabilityScore: 6, nhtsaComplaints: 89, topIssueCategory: "Electrical", safetyRating: 5, type: "sedan" },
  { make: "Hyundai", model: "Sonata", year: 2020, reliabilityScore: 5, nhtsaComplaints: 198, topIssueCategory: "Engine", safetyRating: 5, type: "sedan" },
  { make: "Hyundai", model: "Sonata", year: 2015, reliabilityScore: 4, nhtsaComplaints: 567, topIssueCategory: "Engine", safetyRating: 4, type: "sedan" },

  // Kia
  { make: "Kia", model: "Sportage", year: 2024, reliabilityScore: 7, nhtsaComplaints: 23, topIssueCategory: "None", safetyRating: 5, type: "suv" },
  { make: "Kia", model: "Sportage", year: 2022, reliabilityScore: 6, nhtsaComplaints: 78, topIssueCategory: "Electrical", safetyRating: 5, type: "suv" },
  { make: "Kia", model: "Sportage", year: 2020, reliabilityScore: 6, nhtsaComplaints: 145, topIssueCategory: "Engine", safetyRating: 5, type: "suv" },
  { make: "Kia", model: "Sportage", year: 2017, reliabilityScore: 5, nhtsaComplaints: 345, topIssueCategory: "Engine", safetyRating: 4, type: "suv" },

  { make: "Kia", model: "Forte", year: 2024, reliabilityScore: 7, nhtsaComplaints: 18, topIssueCategory: "None", safetyRating: 5, type: "sedan" },
  { make: "Kia", model: "Forte", year: 2022, reliabilityScore: 7, nhtsaComplaints: 45, topIssueCategory: "None", safetyRating: 5, type: "sedan" },
  { make: "Kia", model: "Forte", year: 2020, reliabilityScore: 6, nhtsaComplaints: 89, topIssueCategory: "Engine", safetyRating: 5, type: "sedan" },
  { make: "Kia", model: "Forte", year: 2017, reliabilityScore: 5, nhtsaComplaints: 234, topIssueCategory: "Engine", safetyRating: 4, type: "sedan" },

  { make: "Kia", model: "Telluride", year: 2024, reliabilityScore: 7, nhtsaComplaints: 21, topIssueCategory: "None", safetyRating: 5, type: "suv" },
  { make: "Kia", model: "Telluride", year: 2022, reliabilityScore: 7, nhtsaComplaints: 56, topIssueCategory: "None", safetyRating: 5, type: "suv" },
  { make: "Kia", model: "Telluride", year: 2020, reliabilityScore: 7, nhtsaComplaints: 89, topIssueCategory: "Electrical", safetyRating: 5, type: "suv" },

  // Jeep
  { make: "Jeep", model: "Grand Cherokee", year: 2024, reliabilityScore: 5, nhtsaComplaints: 56, topIssueCategory: "Electrical", safetyRating: 5, type: "suv" },
  { make: "Jeep", model: "Grand Cherokee", year: 2022, reliabilityScore: 4, nhtsaComplaints: 234, topIssueCategory: "Electrical", safetyRating: 5, type: "suv" },
  { make: "Jeep", model: "Grand Cherokee", year: 2020, reliabilityScore: 4, nhtsaComplaints: 345, topIssueCategory: "Electrical", safetyRating: 5, type: "suv" },
  { make: "Jeep", model: "Grand Cherokee", year: 2017, reliabilityScore: 4, nhtsaComplaints: 567, topIssueCategory: "Electrical", safetyRating: 4, type: "suv" },
  { make: "Jeep", model: "Grand Cherokee", year: 2014, reliabilityScore: 3, nhtsaComplaints: 789, topIssueCategory: "Electrical", safetyRating: 4, type: "suv" },

  { make: "Jeep", model: "Wrangler", year: 2024, reliabilityScore: 5, nhtsaComplaints: 45, topIssueCategory: "Electrical", safetyRating: 4, type: "suv" },
  { make: "Jeep", model: "Wrangler", year: 2022, reliabilityScore: 4, nhtsaComplaints: 198, topIssueCategory: "Electrical", safetyRating: 4, type: "suv" },
  { make: "Jeep", model: "Wrangler", year: 2020, reliabilityScore: 4, nhtsaComplaints: 267, topIssueCategory: "Engine", safetyRating: 4, type: "suv" },
  { make: "Jeep", model: "Wrangler", year: 2018, reliabilityScore: 4, nhtsaComplaints: 456, topIssueCategory: "Engine", safetyRating: 3, type: "suv" },

  // VW
  { make: "Volkswagen", model: "Jetta", year: 2024, reliabilityScore: 6, nhtsaComplaints: 23, topIssueCategory: "None", safetyRating: 5, type: "sedan" },
  { make: "Volkswagen", model: "Jetta", year: 2022, reliabilityScore: 6, nhtsaComplaints: 67, topIssueCategory: "Electrical", safetyRating: 5, type: "sedan" },
  { make: "Volkswagen", model: "Jetta", year: 2019, reliabilityScore: 5, nhtsaComplaints: 145, topIssueCategory: "Electrical", safetyRating: 5, type: "sedan" },
  { make: "Volkswagen", model: "Jetta", year: 2016, reliabilityScore: 5, nhtsaComplaints: 234, topIssueCategory: "Engine", safetyRating: 4, type: "sedan" },

  { make: "Volkswagen", model: "Tiguan", year: 2024, reliabilityScore: 6, nhtsaComplaints: 28, topIssueCategory: "None", safetyRating: 5, type: "suv" },
  { make: "Volkswagen", model: "Tiguan", year: 2022, reliabilityScore: 5, nhtsaComplaints: 89, topIssueCategory: "Electrical", safetyRating: 5, type: "suv" },
  { make: "Volkswagen", model: "Tiguan", year: 2019, reliabilityScore: 5, nhtsaComplaints: 198, topIssueCategory: "Electrical", safetyRating: 5, type: "suv" },

  // BMW
  { make: "BMW", model: "3 Series", year: 2024, reliabilityScore: 5, nhtsaComplaints: 34, topIssueCategory: "Electrical", safetyRating: 5, type: "sedan" },
  { make: "BMW", model: "3 Series", year: 2022, reliabilityScore: 5, nhtsaComplaints: 89, topIssueCategory: "Electrical", safetyRating: 5, type: "sedan" },
  { make: "BMW", model: "3 Series", year: 2020, reliabilityScore: 5, nhtsaComplaints: 145, topIssueCategory: "Electrical", safetyRating: 5, type: "sedan" },
  { make: "BMW", model: "3 Series", year: 2017, reliabilityScore: 4, nhtsaComplaints: 267, topIssueCategory: "Engine", safetyRating: 5, type: "sedan" },
  { make: "BMW", model: "3 Series", year: 2014, reliabilityScore: 4, nhtsaComplaints: 345, topIssueCategory: "Engine", safetyRating: 4, type: "sedan" },

  { make: "BMW", model: "X3", year: 2024, reliabilityScore: 5, nhtsaComplaints: 28, topIssueCategory: "Electrical", safetyRating: 5, type: "suv" },
  { make: "BMW", model: "X3", year: 2022, reliabilityScore: 5, nhtsaComplaints: 78, topIssueCategory: "Electrical", safetyRating: 5, type: "suv" },
  { make: "BMW", model: "X3", year: 2020, reliabilityScore: 5, nhtsaComplaints: 134, topIssueCategory: "Electrical", safetyRating: 5, type: "suv" },
  { make: "BMW", model: "X3", year: 2018, reliabilityScore: 4, nhtsaComplaints: 234, topIssueCategory: "Engine", safetyRating: 5, type: "suv" },

  // Lexus
  { make: "Lexus", model: "ES 350", year: 2024, reliabilityScore: 10, nhtsaComplaints: 6, topIssueCategory: "None", safetyRating: 5, type: "sedan" },
  { make: "Lexus", model: "ES 350", year: 2022, reliabilityScore: 10, nhtsaComplaints: 18, topIssueCategory: "None", safetyRating: 5, type: "sedan" },
  { make: "Lexus", model: "ES 350", year: 2020, reliabilityScore: 10, nhtsaComplaints: 34, topIssueCategory: "None", safetyRating: 5, type: "sedan" },
  { make: "Lexus", model: "ES 350", year: 2018, reliabilityScore: 9, nhtsaComplaints: 56, topIssueCategory: "None", safetyRating: 5, type: "sedan" },

  { make: "Lexus", model: "RX 350", year: 2024, reliabilityScore: 9, nhtsaComplaints: 12, topIssueCategory: "None", safetyRating: 5, type: "suv" },
  { make: "Lexus", model: "RX 350", year: 2022, reliabilityScore: 9, nhtsaComplaints: 28, topIssueCategory: "None", safetyRating: 5, type: "suv" },
  { make: "Lexus", model: "RX 350", year: 2020, reliabilityScore: 9, nhtsaComplaints: 45, topIssueCategory: "None", safetyRating: 5, type: "suv" },
  { make: "Lexus", model: "RX 350", year: 2018, reliabilityScore: 9, nhtsaComplaints: 67, topIssueCategory: "None", safetyRating: 5, type: "suv" },
  { make: "Lexus", model: "RX 350", year: 2016, reliabilityScore: 9, nhtsaComplaints: 89, topIssueCategory: "None", safetyRating: 5, type: "suv" },

  // Ram
  { make: "Ram", model: "1500", year: 2024, reliabilityScore: 5, nhtsaComplaints: 45, topIssueCategory: "Electrical", safetyRating: 5, type: "truck" },
  { make: "Ram", model: "1500", year: 2022, reliabilityScore: 5, nhtsaComplaints: 178, topIssueCategory: "Electrical", safetyRating: 5, type: "truck" },
  { make: "Ram", model: "1500", year: 2020, reliabilityScore: 5, nhtsaComplaints: 345, topIssueCategory: "Electrical", safetyRating: 5, type: "truck" },
  { make: "Ram", model: "1500", year: 2019, reliabilityScore: 5, nhtsaComplaints: 456, topIssueCategory: "Electrical", safetyRating: 5, type: "truck" },

  // Honda Fit
  { make: "Honda", model: "Fit", year: 2020, reliabilityScore: 8, nhtsaComplaints: 34, topIssueCategory: "None", safetyRating: 5, type: "hatchback" },
  { make: "Honda", model: "Fit", year: 2018, reliabilityScore: 8, nhtsaComplaints: 56, topIssueCategory: "None", safetyRating: 5, type: "hatchback" },
  { make: "Honda", model: "Fit", year: 2015, reliabilityScore: 7, nhtsaComplaints: 123, topIssueCategory: "Brakes", safetyRating: 4, type: "hatchback" },

  // Toyota Sienna (minivan)
  { make: "Toyota", model: "Sienna", year: 2024, reliabilityScore: 8, nhtsaComplaints: 23, topIssueCategory: "None", safetyRating: 5, type: "minivan" },
  { make: "Toyota", model: "Sienna", year: 2022, reliabilityScore: 7, nhtsaComplaints: 89, topIssueCategory: "Electrical", safetyRating: 5, type: "minivan" },
  { make: "Toyota", model: "Sienna", year: 2020, reliabilityScore: 8, nhtsaComplaints: 67, topIssueCategory: "None", safetyRating: 5, type: "minivan" },
  { make: "Toyota", model: "Sienna", year: 2017, reliabilityScore: 8, nhtsaComplaints: 134, topIssueCategory: "None", safetyRating: 5, type: "minivan" },

  // Honda Odyssey (minivan)
  { make: "Honda", model: "Odyssey", year: 2024, reliabilityScore: 7, nhtsaComplaints: 28, topIssueCategory: "None", safetyRating: 5, type: "minivan" },
  { make: "Honda", model: "Odyssey", year: 2022, reliabilityScore: 6, nhtsaComplaints: 89, topIssueCategory: "Transmission", safetyRating: 5, type: "minivan" },
  { make: "Honda", model: "Odyssey", year: 2019, reliabilityScore: 5, nhtsaComplaints: 234, topIssueCategory: "Transmission", safetyRating: 5, type: "minivan" },
];

export function getUniqueMakes(): string[] {
  const makes = new Set(exploreCars.map((c) => c.make));
  return Array.from(makes).sort();
}

export function getModelsForMake(make: string): string[] {
  const models = new Set(
    exploreCars.filter((c) => c.make === make).map((c) => c.model)
  );
  return Array.from(models).sort();
}

export function getYearRange(): { min: number; max: number } {
  const years = exploreCars.map((c) => c.year);
  return { min: Math.min(...years), max: Math.max(...years) };
}
