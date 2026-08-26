import { looksLikeCloneRequest } from "../url-guard";
import { wantsFreshBuild, wantsPersonalHome, wantsSiteChange } from "./local-designer";
import { templateMatchers } from "./templates";

function mentionsNewWebsite(text: string) {
  if (/\b(from scratch|start over|another site|separate site|new (?:web ?)?site)\b/i.test(text)) return true;
  if (/\bfor (?:other people|someone else|a client|clients|customers)\b/i.test(text)) return true;
  if (/\b(?:build|make|create|design)\s+(?:me\s+)?(?:a |an )?(?:new )?.{0,48}(?:web\s*)?site\s+for\b/i.test(text)) {
    return true;
  }
  if (
    /\b(?:build|make|create|design|rebuild)\s+(?:me\s+)?(?:a |an |my )?(?:new )?(?:web\s*site|website|homepage)\b/i.test(
      text,
    )
  ) {
    return true;
  }
  if (templateMatchers.some((item) => item.re.test(text)) && /\b(build|make|create)\s+(?:me\s+)?(?:a |an )/i.test(text)) {
    return true;
  }
  return false;
}

export function wantsNewClientSite(text: string) {
  const t = text.trim();
  if (!t) return false;
  if (looksLikeCloneRequest(t)) return true;
  if (wantsPersonalHome(t)) return false;
  if (wantsFreshBuild(t)) return true;
  if (mentionsNewWebsite(t)) return true;
  return false;
}

export function shouldCreateNewProject(message: string, hasActiveProject: boolean) {
  if (looksLikeCloneRequest(message)) return true;
  if (wantsPersonalHome(message)) return false;
  if (wantsNewClientSite(message)) return true;
  if (wantsSiteChange(message) && !hasActiveProject) return true;
  return false;
}

export function shouldEditClientProject(message: string, hasActiveProject: boolean) {
  if (!hasActiveProject) return false;
  if (shouldCreateNewProject(message, hasActiveProject)) return false;
  return wantsSiteChange(message);
}
