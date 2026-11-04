const fundingForm = document.getElementById("fundingForm");
const fundingResult = document.getElementById("fundingResult");

function getAdvice(course, income, district) {
  const adviceMap = {
    Engineering: {
      low: {
        title: "Government engineering + merit scholarship route",
        text: "Prioritize government engineering colleges in Kerala and apply for state scholarships, fee reimbursement, and merit-based assistance. This route gives the best value if your family income is below ₹2.5 lakh."
      },
      mid: {
        title: "Balanced engineering shortlist",
        text: "Shortlist reputed government or aided institutions, then compare private options only if they offer robust placement support and scholarship waivers. Budget planning is key for the middle-income bracket."
      },
      high: {
        title: "Private engineering with placement focus",
        text: "Private colleges may be suitable if they provide competitive placements, industry internships, and strong employer ties. Focus on ROI and long-term career outcomes instead of just reputation."
      }
    },
    "Arts & Science": {
      low: {
        title: "University-affiliated programs with support grants",
        text: "Choose state universities and well-established affiliated colleges with low fees and available fee-waiver schemes. This is a practical option for affordable quality education."
      },
      mid: {
        title: "Career-focused arts and science pathways",
        text: "Select institutions with strong faculty, research exposure, and internship opportunities. You can build a strong profile while keeping cost manageable."
      },
      high: {
        title: "Premium campus and niche specialization",
        text: "If you can invest more, look for colleges that specialize in competitive fields such as data analytics, media studies, or emerging interdisciplinary programs."
      }
    },
    Management: {
      low: {
        title: "Aided management pathways with support schemes",
        text: "Focus on affordable institutions with good MBA placement support and scholarship opportunities. Practical career coaching can often matter more than prestige."
      },
      mid: {
        title: "Balanced business school shortlist",
        text: "Compare college outcomes, internship quality, and average package. A mid-budget school with strong employer connections may outperform a more expensive brand name."
      },
      high: {
        title: "Top-tier business school strategy",
        text: "If your budget allows, look for schools with branding, network access, and industry tie-ups. This can improve placement reach and long-term career growth."
      }
    },
    Medical: {
      low: {
        title: "Government medical pathway with support aid",
        text: "The strongest route is government-backed medical colleges with scholarship and fee reimbursement. These offer the best academic value and lower financial burden."
      },
      mid: {
        title: "Strategic medical selection",
        text: "Compare tuition fees, hostel costs, and public-sector options before considering private colleges. A lower-cost medical option with good outcomes can be smarter than a premium choice."
      },
      high: {
        title: "Private medical investment planning",
        text: "Private medical education is high-cost, so only choose it if the institution has a strong reputation, clinical exposure, and consistent postgraduate outcomes."
      }
    },
    Law: {
      low: {
        title: "Affordable law education route",
        text: "Choose affordable law colleges with active internships, moot court practice, and recognized accreditation. Skills and placements often matter as much as brand name."
      },
      mid: {
        title: "Law + internships strategy",
        text: "Prioritize institutions that provide practical legal exposure, internships, and public-policy or corporate law pathways. This gives better career readiness."
      },
      high: {
        title: "Reputation-driven law college selection",
        text: "A higher-budget law college is justified when it offers a strong legal ecosystem, premium faculty, networking, and internship opportunities."
      }
    }
  };

  const recommendation = adviceMap[course]?.[income] || adviceMap.Engineering.low;
  const localityNote = district === "Any" ? "You are flexible on location, which helps you prioritize affordability and program strength." : `A ${district}-based choice can help you reduce travel cost and stay connected with local internships and support networks.`;

  return `
    <h3>${recommendation.title}</h3>
    <p>${recommendation.text}</p>
    <div class="result-points">
      <span>${localityNote}</span>
      <span>Best focus: admissions + scholarships + ROI before final choice.</span>
    </div>
  `;
}

if (fundingForm) {
  fundingForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const course = document.getElementById("courseInput").value;
    const income = document.getElementById("incomeInput").value;
    const district = document.getElementById("districtInput").value;

    fundingResult.innerHTML = getAdvice(course, income, district);
  });
}
