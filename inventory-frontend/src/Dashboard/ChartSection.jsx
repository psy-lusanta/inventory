import React from "react";
import Bargraph from "./BarGraph";
import DynamicPieChart from "./DynamicPieChart";

function ChartSection() {
    
    return <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
            <Bargraph /> {/*for bargraph*/}
        </div>
        <div className="space-y-6">
            <DynamicPieChart /> {/*for pie chart*/}
        </div>
    </div>
}

export default ChartSection