import { parse } from "yaml";

type template =
  | "app.startup"
  | "fetch.start"
  | "fetch.not_found"
  | "fetch.success"
  | "fetch.expired"
  | "fetch.disabled"
  | "fetch.error"
  | "commit.normal"
  | "commit.release";

interface data {
  environment?: string;
  user_id?: string;
  commit_url?: string;
  repo_url?: string;
  commit_message?: string;
  release_url?: string;
  release_tag?: string;
}

const file = await Bun.file("lib/templates.yaml").text();
const templatesRaw = parse(file);

function flatten(obj: any, prefix: string = "") {
  let result: any = {};

  for (const key in obj) {
    if (typeof obj[key] === "object" && Array.isArray(obj[key]) === false) {
      result = { ...result, ...flatten(obj[key], `${prefix}${key}.`) };
    } else {
      result[`${prefix}${key}`] = obj[key];
    }
  }

  return result;
}

const templates = flatten(templatesRaw);

export function t(template: template, data: data) {
  //    return (randomChoice(templates[template]) as string).replace(/\${(.*?)}/g, (_, key) => (data as any)[key])
  return t_format(t_fetch(template), data);
}

export function t_fetch(template: template) {
  return Array.isArray(templates[template])
    ? (randomChoice(templates[template]) as string)
    : (templates[template] as string);
}

export function t_format(template: string, data: data) {
  return template.replace(/\${(.*?)}/g, (_, key) => (data as any)[key]);
}

export function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
