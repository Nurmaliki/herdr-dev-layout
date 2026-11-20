import { View, div } from "gpui-kit";
import { h_flex } from "gpui-base";
import { theme } from "herdr";

export default class NmLogo extends View {
  render() {
    const t = theme();
    return h_flex().size_full().items_center().px(12).gap(8)
      .child(
        h_flex().items_center().justify_center().w(28).h(28).rounded(7)
          .bg(t.accent)
          .child(div().text_size(13).font_semibold().text_color(t.accent_foreground).child("NM")))
      .child(div().text_size(11).font_semibold().text_color(t.dim).child("herdr-layout"));
  }
}
