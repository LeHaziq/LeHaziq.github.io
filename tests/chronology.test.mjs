import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const generatedRootPage = new URL("../dist/index.html", import.meta.url);

test("the Portfolio renders the approved compact chronology", async () => {
  const rootPage = await readFile(generatedRootPage, "utf8");
  const orderedCopy = [
    "Academic projects",
    "Experience",
    "Research Assistant",
    "Universiti Teknologi MARA (UiTM)",
    "Nov 2024 – Mar 2026",
    "Shah Alam, Selangor",
    "Software Engineer (On-the-Job Trainee)",
    "TalentLabs / Mysoftcare",
    "Jul 2024 – Nov 2024",
    "Kuala Terengganu, Terengganu",
    "System Engineer Intern",
    "Kesatuan Kakitangan Akademik UiTM (MITASA)",
    "Mar 2024 – Jun 2024",
    "Shah Alam, Selangor",
    "Education",
    "Master of Science in Computer Science",
    "Universiti Teknologi MARA (UiTM)",
    "2024 – Present",
    "Shah Alam, Selangor",
    "BSc (Hons.) Information Systems — Intelligent Systems Engineering",
    "Universiti Teknologi MARA (UiTM)",
    "2022 – 2024",
    "Shah Alam, Selangor",
  ];

  let previousIndex = -1;
  for (const copy of orderedCopy) {
    const index = rootPage.indexOf(copy, previousIndex + 1);
    assert.ok(index > previousIndex, `Expected "${copy}" in chronology order`);
    previousIndex = index;
  }

  assert.match(
    rootPage,
    /Machine learning, deep learning, and computer-vision research; CNN and transformer testing; research and technical writing\./,
  );
  assert.match(
    rootPage,
    /Laravel application development and maintenance; feature work, interface updates, and issue diagnosis\./,
  );
  assert.match(
    rootPage,
    /Django and MySQL claim-management system using Python, Django, HTML, CSS, JavaScript, and Bootstrap, including testing, debugging, and deployment\./,
  );
  assert.doesNotMatch(rootPage, /Diploma|Skills/i);
});
