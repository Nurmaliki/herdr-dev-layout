import { View, div, svg } from "gpui-kit";
import { h_flex } from "gpui-base";
import { theme, run, layout, keys, window, shared } from "herdr";

const K = (n) => `mods/kanban/${n}.svg`;
const W = (n) => `mods/workspace-chrome/${n}.svg`;

// [label, icon, action] — action: {panel:"files"} fills the right panel,
// {togglePanel:"agent"} hides it when that child is already showing,
// {mod:"name"} opens an overlay, {toggle:"node"} hides/shows a node, null = palette
const GROUPS = [
  [
    ["Files", K("files"), { panel: "files" }],
    ["Changes", K("changes"), { panel: "changes" }],
    ["Agent", K("eye"), { togglePanel: "agent" }],
  ],
  [
    ["Agents", K("bot"), { mod: "agents" }],
    ["Kanban", K("board"), { mod: "kanban" }],
  ],
  [
    ["GitLens", K("git"), { mod: "gitlens" }],
    ["Worktree", K("branch"), { mod: "worktree" }],
  ],
  [["Help", K("dialog"), { run: "app.help" }]],
];

const RIGHT = [
  ["Sidebar", W("sidebar"), { toggle: "sidebar" }],
  ["Panel", W("panel-right"), { toggle: "panel" }],
];

const find = (n, id) => n?.id === id ? n : (n?.children ?? []).map((c) => find(c, id)).find(Boolean) ?? null;

// "cmd-shift-p" as this keyboard shows it.
function caps(key) {
  const m = window()?.platform === "macos"
    ? { cmd: "⌘", ctrl: "⌃", shift: "⇧", alt: "⌥", option: "⌥" }
    : { cmd: "Ctrl+", ctrl: "Ctrl+", shift: "Shift+", alt: "Alt+", option: "Alt+" };
  return key.split("-").map((p) => m[p.toLowerCase()] ?? p.toUpperCase()).join("");
}

// The keycap bound to a command: globals by action name, a layout's by its JSON args.
function cap(action, args) {
  const section = args && `layout:${shared("layout") ?? ""}`;
  for (const k of keys()) {
    if (!args) {
      if (k.action === action) return caps(k.keys);
      continue;
    }
    if (k.section !== section || !k.action.startsWith("{")) continue;
    try {
      const a = JSON.parse(k.action);
      if (a.command === action && Object.entries(args).every(([x, y]) => a.args?.[x] === y)) return caps(k.keys);
    } catch {}
  }
  return "";
}

function tip(action, label) {
  if (action === null) {
    const k = cap("app.palette");
    return `Command palette${k ? ` (${k})` : ""}`;
  }
  if (action.run) {
    const k = cap(action.run);
    return `${label === "Help" ? "Keybinds" : label}${k ? ` (${k})` : ""}`;
  }
  if (action.mod) {
    const k = cap(`mod.open:${action.mod}`);
    return `Open/close ${label}${k ? ` (${k})` : ""}`;
  }
  if (action.toggle) {
    const k = action.toggle === "sidebar" ? cap("layout.toggle:sidebar") : cap("layout.toggle", { id: action.toggle });
    return `Show/hide the ${action.toggle === "panel" ? "right panel" : action.toggle}${k ? ` (${k})` : ""}`;
  }
  if (action.panel) {
    const k = cap("layout.select", { stack: "panel", child: action.panel });
    return `Show ${label.toLowerCase()} in the panel${k ? ` (${k})` : ""}`;
  }
  if (action.togglePanel) return `Show/hide the ${label.toLowerCase()} panel`;
  return label;
}

function act(action) {
  if (action === null) run("app.palette");
  else if (action.panel) {
    run("layout.show", { id: "panel" });
    run("layout.select", { stack: "panel", child: action.panel });
  } else if (action.togglePanel) {
    const panel = find(layout(), "panel");
    if (panel && !panel.hidden && panel.active === action.togglePanel) run("layout.hide", { id: "panel" });
    else {
      run("layout.show", { id: "panel" });
      run("layout.select", { stack: "panel", child: action.togglePanel });
    }
  } else if (action.toggle) run("layout.toggle", { id: action.toggle });
  else if (action.run) run(action.run);
  else run("mod.open", { name: action.mod });
}

export default class NmNav extends View {
  button(t, [label, icon, action], on) {
    return h_flex().id(`nav-${label}`).h(24).px(7).gap(6).rounded(6).items_center().flex_none()
      .text_size(12).text_color(on ? t.foreground : t.muted).cursor_pointer()
      .tooltip(tip(action, label))
      .when(on, (el) => el.bg(t.selected))
      .hover((s) => s.bg(t.raised).text_color(t.foreground))
      .on_click(() => act(action))
      .child(svg(icon).size(13).flex_none().text_color(on ? t.accent : t.dim))
      .child(label);
  }

  render() {
    const t = theme();
    const tree = layout();
    const panel = find(tree, "panel");
    const active = (action) => !panel || panel.hidden ? false
      : action?.panel ? panel.active === action.panel
      : action?.togglePanel ? panel.active === action.togglePanel
      : false;
    const right = [...RIGHT, [cap("app.palette") || "Commands", K("search"), null]];
    return h_flex().size_full().items_center().px(10)
      .child(div().text_size(11).font_semibold().text_color(t.dim).px(6).flex_none().child("NM"))
      .children(GROUPS.flatMap((group, i) => [
        ...(i ? [div().w(1).h(14).bg(t.border).mx(4).flex_none()] : []),
        ...group.map((item) => this.button(t, item, active(item[2]))),
      ]))
      .child(div().flex_1())
      .children(right.map((item) => this.button(t, item, false)));
  }
}
