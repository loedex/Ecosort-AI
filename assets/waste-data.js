// ─────────────────────────────────────────────
// EcoSort AI — Waste Disposal Data
// ─────────────────────────────────────────────

const WASTE_DATA = {

    Glass: {
        icon: "bi-circle",
        tag: "Recyclable",
        tagColor: "rgba(59, 130, 246, 0.8)",
        ecoPoints: 15,
         theme: {
        gradient : "linear-gradient(90deg, #3B82F6, #1D4ED8)",
        light    : "rgba(59, 130, 246, 0.08)",
        border   : "#3B82F6"
    },
        impact: {
            co2Saved    : "0.3 kg CO₂",
            waterSaved  : "~5 litres",
            recyclability: "High",
            fact: "Recycling one glass bottle saves enough energy to light a 100W bulb for 4 hours!"
        },
        tips: [
            {
                icon: "bi-x-circle text-danger",
                bg: "bg-danger",
                title: "Remove Lids & Caps",
                desc: "Always remove metal or plastic lids before recycling glass. Different materials must be sorted separately."
            },
            {
                icon: "bi-droplet text-primary",
                bg: "bg-primary",
                title: "Rinse It Out",
                desc: "Give glass bottles and jars a quick rinse to remove food residue before placing in the recycling bin."
            },
            {
                icon: "bi-shield-check text-success",
                bg: "bg-success",
                title: "Handle With Care",
                desc: "Broken glass is dangerous. Wrap it in newspaper and label it clearly before disposal for safety."
            }
        ]
    },

    Metal: {
        icon: "bi-gear-fill",
        tag: "Highly Recyclable",
        tagColor: "rgba(245, 158, 11, 0.8)",
        ecoPoints:20,
         theme: {
        gradient : "linear-gradient(90deg, #F59E0B, #D97706)",
        light    : "rgba(245, 158, 11, 0.08)",
        border   : "#F59E0B"
    },
        impact: {
            co2Saved    : "0.8 kg CO₂",
            waterSaved  : "~10 litres",
            recyclability: "Very High",
            fact: "Recycling one aluminium can saves enough energy to run a TV for 3 hours. Aluminium can be recycled forever!"
        },
        tips: [
            {
                icon: "bi-droplet-fill text-primary",
                bg: "bg-primary",
                title: "Empty & Rinse",
                desc: "Empty all contents and rinse cans thoroughly. Even small food residue can contaminate recycling batches."
            },
            {
                icon: "bi-arrows-collapse text-danger",
                bg: "bg-danger",
                title: "Crush to Save Space",
                desc: "Crush aluminium cans flat to maximize space in your recycling bin and collection vehicles."
            },
            {
                icon: "bi-check2-circle text-success",
                bg: "bg-success",
                title: "Check the Symbol",
                desc: "Look for the recycling symbol on the metal. Aluminium and steel are both widely recyclable curbside."
            }
        ]
    },

    Organic: {
        icon: "bi-tree-fill",
        tag: "Compostable",
        tagColor: "rgba(16, 185, 129, 0.8)",
        ecoPoints: 10,
         theme: {
        gradient : "linear-gradient(90deg, #10B981, #047857)",
        light    : "rgba(16, 185, 129, 0.08)",
        border   : "#10B981"
    },
        impact: {
            co2Saved    : "0.5 kg CO₂",
            waterSaved  : "~8 litres",
            recyclability: "Compostable",
            fact: "Composting organic waste returns vital nutrients to the soil and reduces landfill methane emissions by up to 50%!"
        },
        tips: [
            {
                icon: "bi-box text-success",
                bg: "bg-success",
                title: "Use a Compost Bin",
                desc: "Place food scraps, vegetable peels, and garden waste in a compost bin to create rich natural fertilizer."
            },
            {
                icon: "bi-x-lg text-danger",
                bg: "bg-danger",
                title: "Avoid Meat & Dairy",
                desc: "Do not add meat, fish, or dairy to home compost — these attract pests and cause unpleasant odours."
            },
            {
                icon: "bi-moisture text-primary",
                bg: "bg-primary",
                title: "Balance Moisture",
                desc: "Mix wet food waste with dry materials like cardboard or dry leaves to keep compost healthy."
            }
        ]
    },

    Paper: {
        icon: "bi-file-earmark-text",
        tag: "Recyclable",
        tagColor: "rgba(59, 130, 246, 0.8)",
        ecoPoints:12,
         theme: {
        gradient : "linear-gradient(90deg, #60A5FA, #3B82F6)",
        light    : "rgba(96, 165, 250, 0.08)",
        border   : "#60A5FA"
    },
        impact: {
            co2Saved    : "0.2 kg CO₂",
            waterSaved  : "~26 litres",
            recyclability: "High",
            fact: "Recycling one tonne of paper saves 17 trees and 26,000 litres of water. Paper can be recycled up to 7 times!"
        },
        tips: [
            {
                icon: "bi-droplet text-primary",
                bg: "bg-primary",
                title: "Keep It Dry",
                desc: "Wet or greasy paper cannot be recycled. Keep paper and cardboard dry and away from food waste."
            },
            {
                icon: "bi-scissors text-warning",
                bg: "bg-warning",
                title: "Remove Plastic Windows",
                desc: "Remove any plastic film windows from envelopes before recycling. Paper and plastic must be separated."
            },
            {
                icon: "bi-stack text-success",
                bg: "bg-success",
                title: "Flatten Cardboard",
                desc: "Break down and flatten cardboard boxes to save space and make collection and sorting much easier."
            }
        ]
    },

    Plastic: {
        icon: "bi-recycle",
        tag: "Check & Recycle",
        tagColor: "rgba(139, 92, 246, 0.8)",
        ecoPoints:18,
          theme: {
        gradient : "linear-gradient(90deg, #8B5CF6, #6D28D9)",
        light    : "rgba(139, 92, 246, 0.08)",
        border   : "#8B5CF6"
    },
        impact: {
            co2Saved    : "0.6 kg CO₂",
            waterSaved  : "~7 litres",
            recyclability: "Medium",
            fact: "Recycling one plastic bottle saves enough energy to power a 60W lightbulb for 6 hours. Every bottle counts!"
        },
        tips: [
            {
                icon: "bi-droplet-fill text-primary",
                bg: "bg-primary",
                title: "Empty & Rinse",
                desc: "Ensure the container is completely empty and rinsed clean before placing in the recycling bin."
            },
            {
                icon: "bi-arrows-collapse text-danger",
                bg: "bg-danger",
                title: "Flatten It Down",
                desc: "Crush the bottle or container slightly to save important space in the recycling bin."
            },
            {
                icon: "bi-nut-fill text-success",
                bg: "bg-success",
                title: "Check the Number",
                desc: "Look for the recycling number (1-7) on the bottom. Numbers 1 and 2 are most widely accepted curbside."
            }
        ]
    }
};