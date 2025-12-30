// This file contains the default template data that will be seeded when the database is empty
// This ensures that remixed projects start with the same checklist structure

export interface DefaultTemplateCategory {
  name: string;
  sortOrder: number;
  items: DefaultTemplateItem[];
}

export interface DefaultTemplateItem {
  text: string;
  productType: string;
  sortOrder: number;
  referenceImages: string[];
}

export const defaultProductTypes = ["Multi V", "AHU", "ISC", "Water", "H/Kit", "DOAS"];

export const defaultTemplateCategories: DefaultTemplateCategory[] = [
  {
    name: "Material",
    sortOrder: 0,
    items: [
      {
        text: "Diameter and Thickness of refrigerant pipe should be as recommended by LG.",
        productType: "Multi V",
        sortOrder: 0,
        referenceImages: []
      },
      {
        text: "Copper pipe should be covered with a cap for preventing inflow of external materials.",
        productType: "Multi V",
        sortOrder: 1,
        referenceImages: []
      }
    ]
  },
  {
    name: "Refrigerant Pipe",
    sortOrder: 1,
    items: [
      {
        text: "Pipe connection and branch installation must be done according to the LG installation standards.",
        productType: "Multi V",
        sortOrder: 0,
        referenceImages: []
      },
      {
        text: "Pipe welding should be performed while blowing nitrogen through the pipe.",
        productType: "Multi V",
        sortOrder: 1,
        referenceImages: []
      }
    ]
  },
  {
    name: "Drain Pipe",
    sortOrder: 2,
    items: [
      {
        text: "Drain pipe size should be as recommended in the installation manual of LG.",
        productType: "Multi V",
        sortOrder: 0,
        referenceImages: []
      },
      {
        text: "Air vent should be installed to prevent reverse flow in the common drain pipe.",
        productType: "Multi V",
        sortOrder: 1,
        referenceImages: []
      }
    ]
  },
  {
    name: "Communication and Power cable",
    sortOrder: 3,
    items: [
      {
        text: "Communication cable should be two core shield wire and its size should be more than 1.0mm².",
        productType: "Multi V",
        sortOrder: 0,
        referenceImages: []
      },
      {
        text: "Communication cable should be enclosed in a conduit pipe and kept appropriate spacing away from power cable as PDB.",
        productType: "Multi V",
        sortOrder: 1,
        referenceImages: []
      },
      {
        text: "Power of all IDUs should be supplied through one circuit breaker. Don't install individual switch or connect power to the IDU from a separate circuit breaker.",
        productType: "Multi V",
        sortOrder: 2,
        referenceImages: []
      }
    ]
  },
  {
    name: "Indoor Unit",
    sortOrder: 4,
    items: [
      {
        text: "Remote controller should be placed where it would not be influenced by external temperature and the IDU discharge airflow.",
        productType: "Multi V",
        sortOrder: 0,
        referenceImages: []
      },
      {
        text: "Connection of IDU and the drain pipe should be done by a flexible hose to prevent connection breakage or drain pipe crack due to its vibration.",
        productType: "Multi V",
        sortOrder: 1,
        referenceImages: []
      },
      {
        text: "Service hole size should be sufficient for checking and servicing the indoor unit",
        productType: "Multi V",
        sortOrder: 2,
        referenceImages: []
      }
    ]
  },
  {
    name: "Outdoor Unit",
    sortOrder: 5,
    items: [
      {
        text: "Use at least 200mm high concrete or/and H-beam support as a base support of the ODU. And ODU should be fixed tightly with anchor bolt.",
        productType: "Multi V",
        sortOrder: 0,
        referenceImages: []
      },
      {
        text: "Anti-vibration pad should be placed between outdoor unit and foundation.",
        productType: "Multi V",
        sortOrder: 1,
        referenceImages: []
      }
    ]
  },
  {
    name: "AHU",
    sortOrder: 6,
    items: [
      {
        text: "AHU Comm kit Installation (SVC Area, preventing water)",
        productType: "AHU",
        sortOrder: 0,
        referenceImages: []
      },
      {
        text: "EEV kit capacity should match with the ODU",
        productType: "AHU",
        sortOrder: 1,
        referenceImages: []
      },
      {
        text: "Additional Refrigerant : Additional refrigerant of DX coil and extended pipe should be charged",
        productType: "AHU",
        sortOrder: 2,
        referenceImages: []
      }
    ]
  },
  {
    name: "ISC",
    sortOrder: 7,
    items: [
      {
        text: "The anti-vibration pad should be 2 layers of 10 mm or more.",
        productType: "ISC",
        sortOrder: 0,
        referenceImages: []
      },
      {
        text: "2-1. HMI communication line spec should be 0.75㎟ 2-line Shield and the length should be within 500m.",
        productType: "ISC",
        sortOrder: 1,
        referenceImages: []
      },
      {
        text: "Is there a solution for freeze and burst prevention? (antifreeze/ flow-switch/ circulation pump interlock).",
        productType: "ISC",
        sortOrder: 2,
        referenceImages: []
      }
    ]
  }
];
