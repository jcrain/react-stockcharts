"use strict";

import React from "react";
import d3 from "d3";

import ReStock from "react-stockcharts";

var { ChartCanvas, Chart, EventCapture } = ReStock;

var { CandlestickSeries, BarSeries, LineSeries, AreaSeries, MACDSeries } = ReStock.series;
var { discontinuousTimeScaleProvider } = ReStock.scale;

var { CrossHairCursor, MouseCoordinateX, MouseCoordinateY, CurrentCoordinate } = ReStock.coordinates;
var { EdgeIndicator } = ReStock.coordinates;

var { TooltipContainer, OHLCTooltip, MovingAverageTooltip, MACDTooltip } = ReStock.tooltip;

var { XAxis, YAxis } = ReStock.axes;
var { macd, ema, sma } = ReStock.indicator;
var { fitWidth } = ReStock.helper;

var { Brush } = ReStock.interactive;

var ema26 = ema()
	.id(0)
	.windowSize(26)
	.merge((d, c) => {d.ema26 = c})
	.accessor(d => d.ema26);

var ema12 = ema()
	.id(1)
	.windowSize(12)
	.merge((d, c) => {d.ema12 = c})
	.accessor(d => d.ema12);

var macdCalculator = macd()
	.fast(12)
	.slow(26)
	.signal(9)
	.merge((d, c) => {d.macd = c})
	.accessor(d => d.macd);

var smaVolume50 = sma()
	.id(3)
	.windowSize(10)
	.source(d => d.volume)
	.merge((d, c) => {d.smaVolume50 = c})
	.accessor(d => d.smaVolume50);

const BRUSH_TYPE = "2D"; // Valid values = "2D", "1D"

class CandlestickChart extends React.Component {
	constructor(props) {
		super(props);
		this.handleBrush = this.handleBrush.bind(this);
		this.onKeyPress = this.onKeyPress.bind(this);

		this.state = {
			xExtents: [new Date(2012, 0, 3), new Date(2012, 5, 29)],
			yExtents: [d => [d.high, d.low], ema26.accessor(), ema12.accessor()],
		}
	}
	componentDidMount() {
		document.addEventListener("keyup", this.onKeyPress);
	}
	componentWillUnmount() {
		document.removeEventListener("keyup", this.onKeyPress);
	}
	onKeyPress(e) {
		var keyCode = e.which;
		console.log(keyCode);
		switch (keyCode) {
			case 27: { // ESC
				this.refs.brush.getWrappedComponent().terminate();
			}
		}
	}
	handleBrush(brushCoords, startAndEndItem, startAndEndMouseLocation, event) {
		console.log(arguments);
		var left = Math.min(brushCoords.x1, brushCoords.x2);
		var right = Math.max(brushCoords.x1, brushCoords.x2);

		var low = Math.min(brushCoords.y1, brushCoords.y2);
		var high = Math.max(brushCoords.y1, brushCoords.y2);

		// uncomment the line below to make the brush to zoom
		this.setState({
			xExtents: [left, right],
			yExtents: BRUSH_TYPE === "2D" ? [low, high] : this.state.yExtents,
		})
	}
	render() {
		var { data, type, width } = this.props;
		return (
			<ChartCanvas width={width} height={600}
					margin={{left: 70, right: 70, top:20, bottom: 30}} type={type}
					seriesName="MSFT"
					data={data} calculator={[ema26, ema12, smaVolume50, macdCalculator]}
					xAccessor={d => d.date} xScaleProvider={discontinuousTimeScaleProvider}
					xExtents={this.state.xExtents}>
				<Chart id={1} height={400}
						yExtents={this.state.yExtents}
						padding={{ top: 10, bottom: 20 }}>
					<XAxis axisAt="bottom" orient="bottom" showTicks={false} outerTickSize={0} />
					<YAxis axisAt="right" orient="right" ticks={5} />

					<MouseCoordinateY id={0}
						at="right"
						orient="right"
						displayFormat={d3.format(".2f")} />

					<CandlestickSeries />
					<LineSeries yAccessor={ema26.accessor()} stroke={ema26.stroke()}/>
					<LineSeries yAccessor={ema12.accessor()} stroke={ema12.stroke()}/>

					<CurrentCoordinate id={1} yAccessor={ema26.accessor()} fill={ema26.stroke()} />
					<CurrentCoordinate id={2} yAccessor={ema12.accessor()} fill={ema12.stroke()} />

					<EdgeIndicator itemType="last" orient="right" edgeAt="right"
						yAccessor={d => d.close} fill={d => d.close > d.open ? "#6BA583" : "#FF0000"}/>
				</Chart>
				<Chart id={2} height={150}
						yExtents={[d => d.volume, smaVolume50.accessor()]}
						origin={(w, h) => [0, h - 300]}>
					<YAxis axisAt="left" orient="left" ticks={5} tickFormat={d3.format("s")}/>

					<MouseCoordinateY id={0}
						at="left"
						orient="left"
						displayFormat={d3.format(".4s")} />

					<BarSeries yAccessor={d => d.volume} fill={d => d.close > d.open ? "#6BA583" : "#FF0000"} />
					<AreaSeries yAccessor={smaVolume50.accessor()} stroke={smaVolume50.stroke()} fill={smaVolume50.fill()}/>
				</Chart>
				<Chart id={3} height={150}
						yExtents={macdCalculator.accessor()}
						origin={(w, h) => [0, h - 150]} padding={{ top: 10, bottom: 10 }} >
					<XAxis axisAt="bottom" orient="bottom"/>
					<YAxis axisAt="right" orient="right" ticks={2} />
					<MouseCoordinateX id={0}
						at="bottom"
						orient="bottom"
						displayFormat={d3.time.format("%Y-%m-%d")} />
					<MouseCoordinateY id={0}
						at="right"
						orient="right"
						displayFormat={d3.format(".2f")} />

					<MACDSeries calculator={macdCalculator} />
				</Chart>
				<CrossHairCursor />
				<EventCapture mouseMove zoom pan>
					<Brush ref="brush"
						forChart={1} id={0} enabled={true}
						type={BRUSH_TYPE}
						onBrush={this.handleBrush}/>
				</EventCapture>
				<TooltipContainer>
					<OHLCTooltip forChart={1} origin={[-40, 0]}/>
					<MovingAverageTooltip forChart={1} onClick={(e) => console.log(e)} origin={[-38, 15]}
						calculators={[ema26, ema12]}/>
					<MACDTooltip forChart={3} origin={[-38, 15]} calculator={macdCalculator}/>
				</TooltipContainer>
			</ChartCanvas>
		);
	}
}

CandlestickChart.propTypes = {
	data: React.PropTypes.array.isRequired,
	width: React.PropTypes.number.isRequired,
	type: React.PropTypes.oneOf(["svg", "hybrid"]).isRequired,
};

CandlestickChart.defaultProps = {
	type: "svg",
};

var CandleStickChartWithBrush = fitWidth(CandlestickChart)

export default CandleStickChartWithBrush;
