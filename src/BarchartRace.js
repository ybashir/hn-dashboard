import React from "react"
import * as d3 from 'd3'
import './BarchartRace.css'

import {
    Row,
    Col,
    Button,
    Slider
  } from "antd";

  import {
   
    PauseOutlined,
    CaretRightFilled

} from "@ant-design/icons"


class BarChartRace extends React.Component{
    state={
        data:[],
        width: 500,
        duration: 250,
        interpolated_frames: 5,
        currentKF: 0,
        intervalId: 0,
        isPlaying: false,
        keyframes:[]
    }
    resizeObserver = null
    width = 100
    svgElement = React.createRef()
    resizeElement = React.createRef()
    scale = d3.scaleOrdinal(d3.schemeTableau10)
    formatDate = d3.utcFormat("%Y")
    categories=[]
    updateX(){
        this.x = d3.scaleLinear([0, 1], 
            [this.props.margin.left, 
             this.state.width - this.props.margin.right])
    }
    updateY(){
        this.y = d3.scaleBand()
          .domain(d3.range(this.props.bars + 1))
          .rangeRound(
            [this.props.margin.top, 
            this.props.margin.top + 
            this.props.barSize * (this.props.bars + 1 + 0.1)]
          )
          .padding(0.1)
    } 
    stopPlaying = () => {  
        this.setState({
            isPlaying:false
        })
        clearInterval(this.state.intervalId) 
    }
    startPlaying = () => {
        const intervalId = setInterval(this.timer, this.state.duration)
        this.setState({
            isPlaying: true,
            intervalId: intervalId,
            currentKF: this.state.currentKF === this.state.keyframes.length - 1 ?
                        0 : 
                        this.state.currentKF
        }) 
    }
    togglePlay = () => {
        const isPlaying = this.state.isPlaying
        if(!isPlaying){
            this.startPlaying()
        }else{
            this.stopPlaying()
        }
    }
    handleFrameChange = (value) => {        
        if(this.state.isPlaying){
            this.stopPlaying()
        }
        this.updateChart(+value)
    }
    timer = () => {         
        if (this.state.currentKF < this.state.keyframes.length - 1){
            this.updateChart(this.state.currentKF+1)        
        }else{
            this.stopPlaying()
        }        
    }
    updateChart(keyframe){
            this.setState({
                currentKF: keyframe
            },
            ()=>{
                this.drawChart()
            }
        )
    }
    drawChart(){
        const svg = d3.select(this.svgElement.current)
        const keyframe = this.state.keyframes[this.state.currentKF]
        const transition = svg.transition()
            .duration(this.state.duration)
            .ease(d3.easeLinear)
        this.x.domain([0, keyframe[1][0].value]);
        this.updateAxis(keyframe, transition);
        this.updateBars(keyframe, transition);
        this.updateLabels(keyframe, transition);
        this.updateTicker(keyframe, transition);         
    }
    bars(svg) {
        let bar = svg.append("g")
            .attr("fill-opacity", 0.6)
            .selectAll("rect") 
        return ([date, data], transition) => {
           bar = bar
          .data(data.slice(0, this.props.bars), d => d.name)
          .join(
            enter => enter.append("rect")
              .attr("fill", this.color())
              .attr("height", this.y.bandwidth())
              .attr("x", this.x(0))
              .attr("y", this.y(this.props.bars))
              .attr("width", d => this.x(d.value) - this.x(0)),
            (update) => {
                return update
            },
            exit => exit.transition(transition).remove()
              .attr("y", this.y(this.props.bars))
              .attr("width", d => this.x(d.value) - this.x(0))
          )
          .call(bar => bar.transition(transition)
            .attr("y", d => this.y(d.rank))
            .attr("width", d => this.x(d.value) - this.x(0)))            
        }
    }
    labels(svg) {
        let label = svg.append("g")
            .style("font", "bold 12px var(--sans-serif)")
            .style("font-size","12px")
            .style("font-weight","bold")
            .style("font-variant-numeric", "tabular-nums")
            .attr("text-anchor", "end")
            .selectAll("text")
        let textTween=this.textTween
        let parseNumber= string => +string.replace(/,/g, "")    
        return ([date, data], transition) => label = label
          .data(data.slice(0, this.props.bars), d => d.name)
          .join(
            enter => enter.append("text")
              .attr("transform", d => `translate(${this.x(d.value)},${this.y(this.props.bars)})`)
              .attr("y", this.y.bandwidth() / 2)
              .attr("x", -6)
              .attr("dy", "-0.25em")
              .text(d => d.name)
              .call(text => text.append("tspan")
                .attr("fill-opacity", 0.7)
                .attr("font-weight", "normal")
                .attr("x", -6)
                .attr("dy", "1.15em")),
            update => update,
            exit => exit.transition(transition).remove()
              .attr("transform", d => `translate(${this.x(d.value)},${this.y(this.props.bars)})`)
          )
          .call(bar => bar.transition(transition)
            .attr("transform", d => `translate(${this.x(d.value)},${this.y(d.rank)})`)
            .call(g => g.select("tspan").tween("text", function(d) {
                return textTween(parseNumber(this.textContent), d.value);
              })))
    }

    ticker(svg) { 
        const now = svg.append("text")
                    .style("font-weight",'bold')
                    .style("font-size", `${this.props.barSize}px`)
                    .style("font-variant-numeric", "tabular-nums")
                    .attr("text-anchor", "end")
                    .attr("x", this.state.width - 6)
                    .attr("y", this.props.margin.top + this.props.barSize * (this.props.bars - 0.45))
                    .attr("dy", "0.32em")
                    .text(this.formatDate(this.state.keyframes[0][0]))
        return ([date], transition) => {
            const options = {  year: 'numeric', month: 'short'}
            const current = this.state.keyframes[this.state.currentKF][0].toLocaleDateString("en-US", options)
            now.attr("x", this.state.width - 6)
            now.text(current)
        }
    }
    axis(svg) {
        const g = svg.append("g")
            .attr("transform", `translate(0,${this.props.margin.top})`)
        
        const axis = d3.axisTop(this.x)
            .ticks(this.state.width / 160)
            .tickSizeOuter(0)
            .tickSizeInner(-this.props.barSize * (this.props.bars + this.y.padding()))
        
        return (_, transition) => {
            axis.ticks(this.state.width/160)
            g.transition(transition).call(axis)
            g.select(".tick:first-of-type text").remove()
            g.selectAll(".tick:not(:first-of-type) line").attr("stroke", "white")
            g.select(".domain").remove()
        }
    }
    color(){
        const scale = d3.scaleOrdinal(d3.schemeTableau10)
        if (this.state.data.some(d => d.category !== undefined)) {
            const categoryByName = new Map(this.state.data.map(d => [d.name, d.category]))
            scale.domain(categoryByName.values())
            return d => scale(categoryByName.get(d.name))
        }
        return d => scale(d.name)
    }    
    textTween(a, b) {
        const i = d3.interpolateNumber(a, b)
        
        return function(t) {
            this.textContent = d3.format(",d")(i(t))
        }
    }
    rank(a,b,t,data) {
        const names = new Set(data.map(d => d.name))
        const retValues = Array.from(names, name => ({
                name, 
                value: (a.get(name) || 0) * (1 - t) + (b.get(name) || 0) * t
            })
        )
        retValues.sort((a, b) => d3.descending(a.value, b.value))
        for (let i = 0; i < retValues.length; ++i) 
            retValues[i].rank = Math.min(this.props.bars, i)
        return retValues
    }
    getKeyFrames(data){        
        let ka, a, kb, b
        let k = this.state.interpolated_frames
        let datevalues = Array.from(d3.rollup(data, ([d]) => d.value, d => +d.date, d => d.name))
                        .map(([date, data]) => [new Date(date), data])
                        .sort(([a], [b]) => d3.ascending(a, b))
        let keyframes = []
        let datevaluepairs = d3.pairs(datevalues)
        
        for ([[ka, a], [kb, b]] of datevaluepairs) {
            for (let i = 0; i < k; ++i) {
                const t = i / k
                keyframes.push([
                    new Date(ka * (1 - t) + kb * t),
                    this.rank(a,b,t,data)
                ])
            }
        }
        keyframes.push([new Date(kb), this.rank(a,b,1,data)]) 
        return keyframes
    }
    //Gets date from yyyy-mm format either the first or last day of month
    getDateFromString(dateString, lastDay=false){
        let [y,m] = dateString.split('-')
        if (lastDay){
            return new Date(y,m,0)
        }
        return new Date(y,m-1,1)
    }
    componentDidUpdate(prevProps) {  
        if (this.props.dateRange && this.props.dateRange !== prevProps.dateRange) {
            let startDate = this.getDateFromString(this.props.dateRange[0])
            let endDate = this.getDateFromString(this.props.dateRange[1],true)
            const filtered = this.state.data.filter(record => 
                record['date'] >= startDate && record['date'] <= endDate)
            const keyframes = this.getKeyFrames(filtered)
            this.setState({
                    keyframes: keyframes
                },
                ()=>{           
                    this.drawChart()
                }               
            )
        }
    }
    componentWillUnmount() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }
    componentDidMount(){
        const width = this.refs.child.parentNode.clientWidth
        this.resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {  
                this.setState({
                    width:entry.target.clientWidth
                },()=>{
                    if (this.state.keyframes.length>0){
 
                        this.updateX()
                        this.drawChart()
                    }                    
                })
            }
        })  
        this.resizeObserver.observe(this.resizeElement.current);
        this.props.dataset.then(
            (response) => {
                const keyframes = this.getKeyFrames(response)
                const categoryByName = new Map(response.map(d => [d.name, d.category]))
                this.scale.domain(categoryByName.values())
                let catmap = {}                       
                response.forEach((item) => {
                    if (item.category !== ""){
                        if (item.category in catmap){
                            catmap[item.category] = catmap[item.category] + item.value
                        }else{
                            catmap[item.category] = item.value
                        }                     

                    }                                
                })
                this.categories = Object.entries(catmap).sort((a,b)=>b[1]-a[1]).map(item=>item[0]).slice(0,this.props.bars)
                this.setState({ 
                        data:response,
                        width:width,
                        keyframes: keyframes
                    },
                    ()=>{   
                        const svg = d3.select(this.svgElement.current)
                        this.updateX()
                        this.updateY()
                        this.updateBars = this.bars(svg)
                        this.updateAxis = this.axis(svg)
                        this.updateLabels = this.labels(svg)
                        this.updateTicker = this.ticker(svg)             
                        this.drawChart()
                    }               
                )
            }
        )
    } 
    render(){
        return (
            <div ref="child">        
                    <Row>
                        <Col flex="40px" align="left">
                            <Button
                            type="primary"
                            style={{align:"left"}}
                            
                            icon={this.state.isPlaying ?
                                <PauseOutlined /> :
                                <CaretRightFilled />

                            }                  
                            onClick={this.togglePlay}
                        /></Col>
                        <Col flex="auto"> <Slider 
                                id="typeinp" 
                                min={0}
                                max={this.state.keyframes.length-1} 
                                value={this.state.currentKF} 
                                defaultValue={0}
                                onChange={this.handleFrameChange}
                                tooltipVisible={false}
                                step={1}
                            />
                        </Col>            
                    </Row>
                    
                    <Row>
                        <Col span='24' ref={this.resizeElement}>
                            <svg ref={this.svgElement}
                                style={{
                                    width: "100%",
                                    height: this.props.margin.top + 
                                            this.props.margin.bottom + 
                                            this.props.barSize * this.props.bars,
                                    marginRight: this.props.margin.right,
                                    marginLeft: this.props.margin.left
                                }}
                            >
                            </svg>
                        </Col>
                    </Row>
                    <br/>
                    <Row align="middle">
                        {                            
                            this.categories.map(item => 
                                <Col flex="left">
                                    <Row>
                                        <Col className="legend-box"
                                             style={{backgroundColor:this.scale(item)}}>
                                        </Col>
                                        <Col className="legend-label" align="left">{item}</Col>
                                    </Row>
                                    
                                </Col>
                            )
                        }
                    </Row>
            </div>            
        )        
    }
}
export default BarChartRace