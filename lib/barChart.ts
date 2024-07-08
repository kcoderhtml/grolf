export default function barChartGenerator(data: number[], height: number, labels: string[]) {
    const dataPoint = "▓";
    const padChar = "░";
    // find the max value
    const maxValue = Math.max(...data);
    // find the lengh of the longest label or data point
    const longestLabel = Math.max(...labels.map((label) => label.length));
    const longestDataPoint = Math.max(...data.map((data) => data.toString().length)) + 2;

    // find the lengh of the longest label or data point
    const columnWidth = Math.max(longestLabel, longestDataPoint);

    // calculate the division factor
    const divisionFactor = maxValue / height;

    // generate a string that represents the bar chart as emojis stacked on top of each other
    let barChartStringArray: string[] = [];

    let barChartString = "";
    for (let j = 0; j < data.length; j++) {
        barChartString += `${("(" + data[j] + ")").toString().padEnd((columnWidth) * 2 - data[j].toString().length, " ") + " "} `;
    }
    barChartStringArray.push(barChartString);

    barChartString = "";
    for (let j = 0; j < data.length; j++) {
        barChartString += `${labels[j].padEnd((columnWidth) * 2 - labels[j].toString().length, " ")}  `;
    }
    barChartStringArray.push(barChartString);

    for (let i = 0; i < height + 1; i++) {
        let barChartString = "";
        for (let j = 0; j < data.length; j++) {
            if (Math.round(data[j] / divisionFactor) >= i) {
                barChartString += dataPoint.padEnd(columnWidth - dataPoint.length, padChar) + " ";
            } else {
                barChartString += padChar.padEnd(columnWidth - dataPoint.length, padChar) + " ";
            }
        }

        barChartStringArray.push(barChartString);
    }

    return barChartStringArray.reverse().join("\n");
}