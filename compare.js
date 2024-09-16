const fs = require('fs');
const xlsx = require('xlsx');

// Helper function to check if a value is an object and not null
function isObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Function to compare two JSON objects
function compareJSON(json1, json2, path = "") {
    let differences = [];

    // Check for missing keys in json2
    for (const key in json1) {
        if (!(key in json2)) {
            differences.push({ Path: `${path ? path + "." : ""}${key}`, Issue: "Missing key in JSON2" });
        } else {
            // Check if both are objects and not null
            if (isObject(json1[key]) && isObject(json2[key])) {
                differences = differences.concat(compareJSON(json1[key], json2[key], path ? path + "." + key : key));
            }
            // Check if both are arrays
            else if (Array.isArray(json1[key]) && Array.isArray(json2[key])) {
                json1[key].forEach((item1, index) => {
                    if (index < json2[key].length) {
                        differences = differences.concat(compareJSON(item1, json2[key][index], `${path ? path + "." : ""}${key}[${index}]`));
                    } else {
                        differences.push({ Path: `${path ? path + "." : ""}${key}[${index}]`, Issue: "Missing item in JSON2" });
                    }
                });
                if (json2[key].length > json1[key].length) {
                    differences.push({ Path: `${path ? path + "." : ""}${key}`, Issue: `Extra items in JSON2 starting from index ${json1[key].length}` });
                }
            }
            // Compare values
            else if (json1[key] !== json2[key]) {
                differences.push({ Path: `${path ? path + "." : ""}${key}`, Issue: `Value mismatch: JSON1 has '${json1[key]}', JSON2 has '${json2[key]}'` });
            }
        }
    }

    // Check for extra keys in json2
    for (const key in json2) {
        if (!(key in json1)) {
            differences.push({ Path: `${path ? path + "." : ""}${key}`, Issue: "Extra key in JSON2" });
        }
    }

    return differences;
}

// Function to export differences to an Excel file
function exportToExcel(differences, filename) {
    const worksheet = xlsx.utils.json_to_sheet(differences);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Differences');
    xlsx.writeFile(workbook, filename);
    console.log(`Differences exported to ${filename}`);
}

// Load JSON data from files
const exampleJSON = JSON.parse(fs.readFileSync('./jsons/example.json', 'utf8'));
const anotherJSON = JSON.parse(fs.readFileSync('./jsons/another.json', 'utf8'));

// Compare JSON files
const differences = compareJSON(exampleJSON, anotherJSON);

// Export differences to an Excel file
if (differences.length > 0) {
    exportToExcel(differences, 'json_differences.xlsx');
} else {
    console.log("The JSON objects are identical.");
}
