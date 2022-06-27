import { ParentSize } from "@visx/responsive";
import { Axis, BarSeries, ThemeContext, XYChart, Tooltip } from "@visx/xychart";
import { bin, HistogramGeneratorNumber } from "d3-array";
import { timeMonth, timeMonths, timeYears } from "d3-time";
import { timeFormat } from "d3-time-format";
import { min } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { theme } from "twin.macro";
import { isMissingDeclaration } from "typescript";
import { SolidarityAction } from "../data/types";
import { useMediaQuery } from "../utils/mediaQuery";
import { down } from "../utils/screens";

export function CumulativeMovementChart({
  data,
  onSelectYear,
}: {
  data: SolidarityAction[];
  cumulative?: boolean;
  onSelectYear?: (year: string) => void;
}) {
  const actionDates = data.map((d) => new Date(d.fields.Date));
  const minDate = min([new Date("2000-01-01"), ...actionDates]);
  const maxDate = new Date();

  const isSmallScreen = useMediaQuery(down("md"));
  const fixedTimelineWidth =
    (maxDate.getFullYear() - minDate.getFullYear()) * 15;

  return (
    <div
      className={`relative cursor-pointer action-chart overflow-x-scroll md:overflow-x-visible`}
      style={{ height: 120, maxHeight: "25vh", width: "100%" }}
    >
      <ParentSize>
        {(parent) => (
          <>
            <CumulativeChart
              data={data}
              minDate={minDate}
              maxDate={maxDate}
              width={isSmallScreen ? fixedTimelineWidth : parent.width}
              height={parent.height}
              onSelectYear={onSelectYear}
              isSmallScreen={isSmallScreen}
            />
          </>
        )}
      </ParentSize>
    </div>
  );
}

type Data = ReturnType<HistogramGeneratorNumber<SolidarityAction, number>>;
type Datum = Data[0] & { y: number };

type AccessorFn = (d: Datum) => any;

const accessors: {
  xAccessor: AccessorFn;
  yAccessor: AccessorFn;
} = {
  xAccessor: (bin) => Number(bin["x0"]),
  yAccessor: (bin) => bin.y,
};

export function CumulativeChart({
  data,
  height = 300,
  width = 300,
  minDate,
  maxDate,
  onSelectYear,
  isSmallScreen,
}: {
  minDate: Date;
  maxDate: Date;
  data: SolidarityAction[];
  height?: number;
  width?: number;
  cumulative?: boolean;
  onSelectYear?: (year: string) => void;
  isSmallScreen: boolean;
}) {
  var yearBins = timeYears(
    timeMonth.offset(minDate, -1),
    timeMonth.offset(maxDate, 1)
  );

  const [hoverDatum, setHoverDatum] = useState<Datum | null>();

  const createBinFn = (dateBins: Date[]) => {
    return bin<SolidarityAction, Date>()
      .thresholds(dateBins)
      .value((d) => new Date(d.fields.Date))
      .domain([minDate, maxDate]);
  };

  const yearBinFn = createBinFn(yearBins);

  const binnedData = useMemo(() => {
    let d = yearBinFn(data);
    for (var i = 0; i < d.length; i++) {
      d[i]["y"] = d[i].length || 0;
    }
    return d;
  }, [data]);

  return (
    <ThemeContext.Provider
      value={{
        backgroundColor: "transparent",
        colors: [theme`colors.activeBlue`, theme`colors.hoverBlue`],
        axisStyles: {
          x: {
            // @ts-ignore
            bottom: {
              axisLine: {
                stroke: theme`colors.gray.400`,
              },
              tickLine: {
                stroke: "transparent",
              },
              tickLabel: {
                className: "font-mono fill-current text-gray-400 text-xs",
                dominantBaseline: "top",
                textAnchor: "middle",
              },
            },
          },
        },
      }}
    >
      <XYChart
        width={width}
        height={height}
        xScale={{ type: "band" }}
        yScale={{ type: "linear" }}
        margin={{ left: 0, right: 0, bottom: 50, top: 0 }}
      >
        <BarSeries
          dataKey="Frequency"
          data={binnedData as any}
          {...accessors}
          onPointerUp={(e) => {
            onSelectYear?.(timeFormat("%Y")(accessors.xAccessor(e.datum)));
          }}
          onPointerMove={(e) => setHoverDatum(e.datum)}
          onPointerOut={(e) => setHoverDatum(null)}
          colorAccessor={(datum) =>
            datum == hoverDatum
              ? theme`colors.hoverBlue`
              : theme`colors.activeBlue`
          }
        />
        <Axis orientation="bottom" tickFormat={timeFormat("%Y")} />
        {!isSmallScreen && (
          <Tooltip
            snapTooltipToDatumX
            snapTooltipToDatumY
            offsetLeft={0}
            renderTooltip={({ tooltipData }: any) => {
              if (tooltipData?.nearestDatum?.datum[0])
                return (
                  <div className="bg-white border-hoverBlue border-solid border-1 w-[150px] relative left-minus-75px p-1 ">
                    <div className="tooltip-year">
                      <p className=" font-mono text-darkGrey">
                        {tooltipData?.nearestDatum?.datum[0].fields.Date.slice(
                          0,
                          4
                        )}
                      </p>
                      <p className="font-serif text-lg text-black">
                        {tooltipData?.nearestDatum?.datum?.length} cases
                      </p>
                    </div>
                  </div>
                );
              else return null;
            }}
          />
        )}
      </XYChart>
    </ThemeContext.Provider>
  );
}
