import type { GitBranch } from "lucide";
import { type Handle, type MixInput } from "remix/component";

export type LucideIcon = typeof GitBranch;

export interface IconProps {
  icon: LucideIcon;
  mix?: MixInput<SVGSVGElement>;
}

export function Icon(handle: Handle<IconProps>) {
  return () => {
    let { icon, mix } = handle.props;

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        mix={mix}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        {icon.map(([tag, attributes], index) => {
          if (tag === "circle") {
            return (
              <circle
                key={index}
                cx={String(attributes.cx)}
                cy={String(attributes.cy)}
                r={String(attributes.r)}
              />
            );
          }
          if (tag === "line") {
            return (
              <line
                key={index}
                x1={String(attributes.x1)}
                x2={String(attributes.x2)}
                y1={String(attributes.y1)}
                y2={String(attributes.y2)}
              />
            );
          }
          if (tag === "rect") {
            return (
              <rect
                key={index}
                x={String(attributes.x)}
                y={String(attributes.y)}
                width={String(attributes.width)}
                height={String(attributes.height)}
                rx={attributes.rx === undefined ? undefined : String(attributes.rx)}
              />
            );
          }
          return <path key={index} d={String(attributes.d)} />;
        })}
      </svg>
    );
  };
}
