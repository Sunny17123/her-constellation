import { useParams, Link } from "react-router-dom";
import { getPersonById } from "@/data/load";

export default function PersonPage() {
  const { id } = useParams<{ id: string }>();
  const person = id ? getPersonById(id) : null;

  if (!person) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">未找到该人物</p>
          <Link to="/" className="text-primary hover:underline">
            ← 返回地球
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto pt-24">
      <Link to="/" className="text-primary hover:underline text-sm mb-6 inline-block">
        ← 返回地球
      </Link>

      <h1 className="text-4xl font-serif mb-2">{person.name_zh}</h1>
      <p className="text-muted-foreground mb-6">{person.name_en}</p>

      <div className="space-y-4 text-sm">
        <div>
          <span className="text-muted-foreground">时代：</span>
          <span>{person.time_period}</span>
        </div>
        <div>
          <span className="text-muted-foreground">地域：</span>
          <span>{person.region_zh}</span>
        </div>
        <div>
          <span className="text-muted-foreground">议题：</span>
          <span>{person.themes.join("、")}</span>
        </div>
      </div>

      <div className="mt-8 prose prose-invert max-w-none">
        <h2 className="text-xl font-serif mb-3">她的故事</h2>
        <p className="leading-relaxed whitespace-pre-wrap">{person.short_story}</p>
      </div>

      <div className="mt-8 p-4 border border-primary/30 rounded-lg bg-primary/5">
        <h3 className="text-lg font-serif mb-2 text-primary">为什么她值得被看见</h3>
        <p className="text-sm leading-relaxed">{person.why_visible}</p>
      </div>

      <div className="mt-6 p-4 border border-secondary/30 rounded-lg bg-secondary/5">
        <h3 className="text-lg font-serif mb-2 text-secondary-foreground">
          与今天的你有什么关系
        </h3>
        <p className="text-sm leading-relaxed">{person.relevance_today}</p>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-serif mb-3">来源</h3>
        <ul className="space-y-2 text-sm">
          {person.source_urls.map((url, i) => (
            <li key={i}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline break-all"
              >
                {url}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
