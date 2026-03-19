import svgPaths from "./svg-fhq21pg7zj";

function Group1() {
  return (
    <div className="h-[422px] relative w-[308px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 308 422">
        <g id="Group 2">
          <path d={svgPaths.p1ade3840} fill="var(--fill-0, #0065B1)" id="Polygon 1" />
          <g id="Group 3">
            <path d={svgPaths.p30405080} fill="var(--fill-0, #D9D9D9)" id="Star 1" />
            <path d={svgPaths.p225cbf00} fill="var(--fill-0, #D9D9D9)" id="Polygon 2" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function Group() {
  return (
    <div className="absolute contents left-[30px] top-[23px]">
      <div className="absolute bg-[#d9d9d9] h-[321px] left-[65px] rounded-[45px] top-[101px] w-[390px]" />
      <div className="absolute bg-[#0065b1] h-[124px] left-[30px] top-[23px] w-[460px]" />
      <div className="absolute bg-[#d9d9d9] h-[114px] left-[171px] rounded-[40px] top-[72px] w-[178px]" />
      <div className="absolute bg-[#0065b1] h-[119px] left-[197px] rounded-[25px] top-[96px] w-[126px]" />
      <div className="absolute bg-[#d9d9d9] h-[119px] left-[65px] top-[147px] w-[390px]" />
      <div className="absolute flex h-[422px] items-center justify-center left-[106px] top-[114px] w-[308px]">
        <div className="-scale-y-100 flex-none rotate-180">
          <Group1 />
        </div>
      </div>
      <div className="absolute bg-[#d9d9d9] h-[54px] left-[65px] top-[147px] w-[390px]" />
      <div className="absolute bg-[#0065b1] h-[52px] left-[42px] top-[422px] w-[436px]" />
    </div>
  );
}

function Group2() {
  return (
    <div className="absolute contents left-0 top-0">
      <div className="absolute flex h-[511px] items-center justify-center left-0 top-0 w-[520px]">
        <div className="-scale-y-100 flex-none rotate-180">
          <div className="bg-[#0065b1] h-[511px] rounded-[67px] w-[520px]" />
        </div>
      </div>
      <Group />
    </div>
  );
}

export default function Frame() {
  return (
    <div className="relative size-full">
      <Group2 />
    </div>
  );
}