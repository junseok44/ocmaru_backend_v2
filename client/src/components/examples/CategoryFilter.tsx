import CategoryFilter from "../CategoryFilter";
import { useState } from "react";

export default function CategoryFilterExample() {
  const [selected, setSelected] = useState("");
  const categories = ["돌봄", "의료", "환경", "교육", "생활", "교통", "경제", "문화", "정치", "행정", "복지"];

  return (
    <CategoryFilter
      categories={categories}
      selected={selected}
      onSelect={(cat) => {
        setSelected(cat);
        console.log("Selected:", cat || "전체");
      }}
    />
  );
}
