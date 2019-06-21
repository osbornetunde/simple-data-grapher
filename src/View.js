import {CsvParser} from "./CsvParser";
import {SimpleDataGrapher} from "./SimpleDataGrapher";
import XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import Chart from 'chartjs'
import Papa from 'papaparse'

class View{
    'use strict';
    elementId = null;
    element = null;
    fileUploadId = null;
    remoteFileUploadId = null;
    csvStringUploadId = null;
    googleSheetUploadId = null;
    csvFile = null;
    dragDropHeadingId = null;
    uploadButtonId = null;
    csvParser = null;
    graphCounting = 0;
    addGraphButtonId = null;
    tableXId = null;
    tableYId = null;
    tableXInputName = null;
    tableYInputName = null;
    carousalClass = null;
    carousalId = null;
    graphMenuId = null;
    plotGraphId = null;
    graphMenuTypeInputName = null;
    canvasContinerId = null;
    xyToggle = null;
    xyToggleName = null;
    tableXParentId = null;
    tableYParentId = null;

    handleFileSelectlocal(event) {
        this.csvFile = event.target.files[0];
        console.log("iam here in handle");
        console.log(this);
        if 	(this.csvFile['name'].split(".")[1]!="csv"){
            alert("Invalid file type");
        }
        else{
            $('#' + this.dragDropHeadingId).text(this.csvFile['name']);
            let self=this;
            document.getElementById(this.uploadButtonId).onclick = (e) => {
                self.csvParser = new CsvParser(self.csvFile, self.elementId, "local");
            }
        }
    }
    handleFileSelectstring(val){
        console.log("i am at csv string handler");
        var csv_string = val.split("\n");
        var mat=[];
        for (var i=0;i<csv_string.length;i++){
            if (csv_string[i]=="" || csv_string[i]==" "){
            continue;
            }
            var dataHash=Papa.parse(csv_string[i],{
            dynamicTyping: true,
            comments: true
            });
            mat[i]=dataHash['data'][0];
        }
        this.csvFile=mat;
        let self = this;
        document.getElementById(this.uploadButtonId).onclick = (e) => {
            console.log("i am uploading");
            self.csvParser = new CsvParser(self.csvFile, self.elementId,"csvstring");
        };

    }
    headersForGoogleSheet(hashSheet){
        var headers_sheet=[];
        for (var key in hashSheet){
            var h=hashSheet[key];
            for (var headKey in h){
                if (headKey.slice(0,4)=="gsx$"){
                    headers_sheet.push(headKey);
                }
            }
            break;
        }
        return headers_sheet;
    }
    completeMatrixForGoogleSheet(hashSheet,headers_sheet){
        var matrixComplete=[];
        for (var i=0;i<headers_sheet.length;i++){
            matrixComplete[i]=[];
        }
        for (var j=0;j<headers_sheet.length;j++){
            for (var key in hashSheet){
                var valueCell=hashSheet[key][headers_sheet[j]]["$t"];
                if (!isNaN(valueCell)){
                    matrixComplete[j].push(+valueCell);}
                else{
                    matrixComplete[j].push(valueCell);
                }
            }
        }
        return matrixComplete;
    }
    handleFileSelectGoogleSheet(mydata){
        
        
        var hashSheet=mydata;
        var headers_sheet=this.headersForGoogleSheet(hashSheet);
        var matrixComplete=this.completeMatrixForGoogleSheet(hashSheet,headers_sheet);
        
        for (var i=0;i<headers_sheet.length;i++){
            headers_sheet[i]=headers_sheet[i].slice(4,headers_sheet[i].length);
        }
        this.csvFile=[headers_sheet,matrixComplete];
        let self=this;
        document.getElementById(this.uploadButtonId).onclick = (e) => {
            self.csvParser = new CsvParser(self.csvFile, self.elementId, "googleSheet");
        };
    }
    getValueGoogleSheet(googleSheetLink){
        let self=this;
        $.getJSON(googleSheetLink, function(data) {
            self.handleFileSelectGoogleSheet(data.feed.entry);
        });

    }
    sendRemoteFileToHandler(remoteVal){
        this.csvFile=remoteVal;
        this.handleFileSelectstring(this.csvFile);
    }
    handleFileSelectremote(val){
        const proxyurl = "https://cors-anywhere.herokuapp.com/"; 
        const url = val;
        fetch(proxyurl + url)
        .then(response => response.text())
        .then(contents => this.sendRemoteFileToHandler(contents))
        .catch((e) => console.log(e)) ;

    }

    determineType(type){
        console.log("at type");
        console.log(type);
        if (type=="Basic" || type=="Stepped" || type=="Point"){
            return 'line';
        }
        else if (type=="Horizontal"){
            return 'horizontalBar';
        }
        else if (type=="Vertical"){

            return 'bar';
        }
        else{
            return type.toLowerCase();
        }
    }

    colorGenerator(i,tb,type,count){
        console.log("at color");
        var colors=['rgba(255, 77, 210, 0.5)','rgba(0, 204, 255, 0.5)','rgba(128, 0, 255, 0.5)','rgba(255, 77, 77, 0.5)','rgba(0, 179, 0, 0.5)','rgba(255, 255, 0, 0.5)','rgba(255, 0, 102, 0.5)','rgba(0, 115, 230, 0.5)'];
        var bordercolors=['rgb(255, 0, 191)','rgb(0, 184, 230)','rgb(115, 0, 230)','rgb(255, 51, 51)','rgb(0, 153, 0)','rgb(230, 230, 0)','rgb(230, 0, 92)','rgb(0, 102, 204)'];
        var length=8;
        if (type=="Pie" || type=="Doughnut"){
            var colorSet=[];
            var borderColorSet=[];
            for (var j=0;j<count;j++){
                colorSet.push(colors[j%length]);
                borderColorSet.push(bordercolors[j%length]);
            }
            if (tb=="bg"){
                return colorSet;
            }
            else{
                return borderColorSet;
            }
        }
        else{
            if (tb=="bg"){
                return colors[i%length];
            }
            else{
                return bordercolors[i%length];
            }
        }
    }

    determineData(type,i,hash){
        console.log("at data");
        var h = {};
        if (type=="Basic"){
            h['fill'] = false;
        }
        else if (type=="Stepped"){
            h['steppedLine']= true;
            h['fill']= false;
        }
        else if (type=="Point"){
            h['showLine']= false;
            h['pointRadius']= 10;
        }
        h['backgroundColor']=this.colorGenerator(i,"bg",type,hash['y_axis_values'+i].length);
        h['borderColor']=this.colorGenerator(i,"bo",type,hash['y_axis_values'+i].length);
        h['borderWidth']=1;
        h['label']=hash['labels'][1][i];
        h['data']=hash['y_axis_values'+i];
        return h;
    }

    determineConfig(hash,length,type){
        console.log("at config");
        var config = {};
        config['type'] = this.determineType(type);
        var data={};
        data['labels']= hash['x_axis_labels'];
        var datasets=[];
        for (var i=0;i<length;i++){
            var h = this.determineData(type,i,hash);
            datasets.push(h);
        }
        var options={'responsive':true, 'maintainAspectRatio': true, 'chartArea': {
                backgroundColor: 'rgb(204, 102, 255)'
            }};
        options['scales']= this.scales(hash);
        config['options']=options;
        data['datasets']=datasets;
        config['data']=data;
        return config;
    }

    scales(hash){
        console.log("at scales");
        var scales= {
            xAxes: [{
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: hash['labels'][0]
                }
            }],
            yAxes: [{
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: 'Value'
                }
            }]
        }
        return scales;
    }
    saveAsImageFunction(xx){
        console.log("entered image");
        var x=new Date();
        var timestamp=x.getTime();
        var temp=xx;
        temp="#"+temp;
        console.log(temp,"omg");
        // var temp2=temp.slice(0,temp.length-5);
        // console.log(temp2);
        console.log(document.getElementById(xx));
        var tt=document.getElementById(xx);
        $(temp).get(0).toBlob(function(blob) {
            saveAs(blob, "chart"+timestamp);
        });

    }
    createSaveAsImageButton(canvasDiv,canvasId){
        var saveImageButton=document.createElement("BUTTON");
        saveImageButton.classList.add("btn");
        saveImageButton.classList.add("btn-primary");
        saveImageButton.innerHTML="Save as Image";
        saveImageButton.id=canvasId+"image";
        canvasDiv.appendChild(saveImageButton);
        console.log(this,"this");
        let self=this;
        document.getElementById(saveImageButton.id).onclick = (e) => {
        self.saveAsImageFunction(canvasId);
        }
    }
    plotGraph(hash,length,type,flag){
        if (flag){
            console.log("at plotGraph");
            document.getElementById(this.canvasContinerId).innerHTML="";
        }
        var div = document.createElement('div');
        div.classList.add(this.elementId + '_chart_container_'+this.graphCounting);
        var canv = document.createElement('canvas');
        canv.id= this.elementId + '_canvas_'+ this.graphCounting;
        div.appendChild(canv);
        document.getElementById(this.canvasContinerId).appendChild(div);
        var ctx = canv.getContext('2d');
        var configuration = this.determineConfig(hash,length,type);
        new Chart(ctx, configuration);
        this.createSaveAsImageButton(div,canv.id);
        $('.'+this.carousalClass).carousel(2);
    }
    createSheet(){
        var wb = XLSX.utils.book_new();
        wb.Props = {
                Title: "New Spreadsheet"+this.elementId,
                CreatedDate: new Date()
        };
        
        wb.SheetNames.push("Sheet"+this.elementId);
        var ws_data = this.csvParser.completeCsvMatrixTranspose;
        var ws = XLSX.utils.aoa_to_sheet(ws_data);
        wb.Sheets["Sheet"+this.elementId] = ws;
        var wbout = XLSX.write(wb, {bookType:'xlsx',  type: 'binary'});
        function s2ab(s) {
    
                var buf = new ArrayBuffer(s.length);
                var view = new Uint8Array(buf);
                for (var i=0; i<s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
                return buf;
                
        }
        saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), 'newSpreadsheet'+this.elementId+'.xlsx');

    }

    afterSampleData(flag){
        console.log("at checkbox");
        console.log(this.csvParser.completeCsvMatrix);
        document.getElementById(this.plotGraphId).onclick = (e) => {
            console.log("at click on plot_graph");
            e.preventDefault();
            var hash={};
            var ix=$('input[name=' + this.tableXInputName + ']:checked').val();
            console.log(ix);
            hash["x_axis_labels"]=this.csvParser.completeCsvMatrix[ix];
            var columns = new Array();
            var y_axis_names = new Array();
            $("input:checkbox[name=" + this.tableYInputName +"]:checked").each((index, element)=>{
                columns.push(element.value);
            });
            for(var i=0;i<columns.length;i++){
                hash["y_axis_values"+(i)]=this.csvParser.completeCsvMatrix[columns[i]];
                y_axis_names.push(this.csvParser.csvHeaders[columns[i]]);
            }
            var labels=[this.csvParser.csvHeaders[ix],y_axis_names];
            hash["labels"]=labels;
            var type=$('input[name='+ this.graphMenuTypeInputName +']:checked').val();
            console.log(hash);
            this.plotGraph(hash,columns.length,type,flag);

        };
    }

    graphMenu(){
        $('.' + this.carousalClass).carousel(1); 
        console.log("at menu");
        document.getElementById(this.graphMenuId).innerHTML="";
        var bar=["Bar","Horizontal","Vertical"];
        var line=["Line","Basic","Stepped","Point"];
        var disc=["Disc","Pie","Doughnut","Radar"];
        var types=[bar,line,disc];
        for (var i=0;i<3;i++){
            var tr=document.createElement('tr');
            var td_head=document.createElement('td');
            td_head.className=types[i][0];
            td_head.appendChild(document.createTextNode(types[i][0]));
            tr.appendChild(td_head);
            for (var j=1;j<types[i].length;j++){
                var td=document.createElement('td');
                var radio=document.createElement('input');
                radio.type = 'radio';
                radio.value = types[i][j];
                td.appendChild(document.createTextNode(types[i][j]));
                radio.name = this.graphMenuTypeInputName;
                td.appendChild(radio);
                tr.appendChild(td);
            }
            document.getElementById(this.graphMenuId).appendChild(tr);
        }
    }



    tableGenerator(name,tableId,typeOfInput,validValues,flag,tableType,badgeType){
        console.log("i am in tablegenerator");
        console.log("at tableGenerator");
        document.getElementById(tableId).innerHTML="";
        var trhead=document.createElement('tr');
        for (var i=0;i<this.csvParser.csvHeaders.length;i++){
            var td=document.createElement('td');
            var span=document.createElement('span');
            var textnode=document.createTextNode(this.csvParser.csvHeaders[i]);
            span.appendChild(textnode);
            span.classList.add("badge");
            span.classList.add("badge-pill");
            span.classList.add(badgeType);
            td.appendChild(span);
            for (var j=0;j<validValues.length;j++){
                if (validValues[j]==this.csvParser.csvHeaders[i]){
                    var checkbox=document.createElement('input')
                    checkbox.type = typeOfInput;
                    checkbox.value = i;
                    checkbox.name = name;
                    checkbox.classList.add("check-inputs");
                    span.appendChild(checkbox);}
            }
            trhead.appendChild(td);
        }
        trhead.classList.add(tableType);
        document.getElementById(tableId).appendChild(trhead);
        for(var x=0;x<this.csvParser.csvSampleData[0].length;x++){
            var tr=document.createElement('tr');
            for(var y=0;y<this.csvParser.csvHeaders.length;y++){
                var tds=document.createElement('td');
                tds.appendChild(document.createTextNode(this.csvParser.csvSampleData[y][x]));
                tr.appendChild(tds);
            }
            document.getElementById(tableId).appendChild(tr);
        }
        this.afterSampleData(flag);
    }

    showSampleDataXandY(){
        console.log("at sampleDataXandY",this);
        document.getElementById(this.addGraphButtonId).onclick = (e) => {
            console.log("at " + this.addGraphButtonId);
            this.graphCounting++;
            $('.'+this.carousalClass).carousel(1); /// ---------------> after
            this.tableGenerator(this.tableXInputName, this.tableXId, 'radio', this.csvParser.csvHeaders, false, 'table-success','badge-success');
            this.tableGenerator(this.tableYInputName, this.tableYId, 'checkbox', this.csvParser.csvValidForYAxis, false, 'table-warning','badge-warning');
            this.graphMenu();

        };
        this.tableGenerator(this.tableXInputName, this.tableXId, 'radio', this.csvParser.csvHeaders, true, 'table-success','badge-success');
        this.tableGenerator(this.tableYInputName, this.tableYId, 'checkbox', this.csvParser.csvValidForYAxis, true, 'table-warning','badge-warning');
        this.graphMenu();
    }

    continueViewManipulation(x){
        console.log(" i am back in view manipulation",this);
        this.csvParser=x;
        this.showSampleDataXandY();
        // this.showSampleDataXandY(this.csvParser.csvSampleData, this.csvParser.csvHeaders, this.csvParser.csvValidForYAxis, this.csvParser.csvSampleData);
        // sampleDataXandY(this.csvSampleData,this.csvHeaders,this.csvValidForYAxis,this.completeCsvMatrix);
        // matrixForCompleteData(headers,this.csvMatrix,start);
    }

    constructor(elementId){
        console.log("i am in view");
        this.elementId = elementId;
        this.element = document.getElementById(elementId);
        if(this.element == null){
            throw "No element exist with this id";
        }
        console.log("i am in view");
        this.fileUploadId = elementId + "_csv_file";
        this.remoteFileUploadId= elementId + "_remote_file";
        this.csvStringUploadId= elementId + "_csv_string";
        this.googleSheetUploadId= elementId + "_google_sheet";
        this.dragDropHeadingId = elementId + "_drag_drop_heading";
        this.uploadButtonId = elementId + "_file_upload_button";
        this.addGraphButtonId = elementId + "_add_graph";
        this.createSpreadsheetButtonId = elementId + "_save_as_spreadsheet";
        this.tableXId = elementId + "_tableX";
        this.tableYId = elementId + "_tableY";
        this.tableXParentId = elementId + "_Xtable";
        this.tableYParentId = elementId + "_Ytable";
        this.tableXInputName = elementId + "_x_axis_input_columns";
        this.tableYInputName = elementId + "_y_axis_input_columns";
        this.carousalClass = elementId + "_carousal";
        this.carousalId = elementId + "_carousalId";
        this.graphMenuId = elementId + "_graph_menu";
        this.plotGraphId = elementId + "_plot_graph";
        this.graphMenuTypeInputName = elementId + "_types";
        this.canvasContinerId = elementId + "_canvas_container";
        this.xyToggleName = elementId + "_xytoggle";
        this.saveAsImageId = elementId + "save-as-image";
        this.drawHTMLView();
        this.addListeners();
        $('.' + this.carousalClass).carousel({
            interval: false
        });
        $('.xytoggle').bootstrapToggle({
            on: 'X-Axis',
            off: 'Y-Axis'
        });
        $('input[name=' + this.xyToggleName +']:checked').change(()=>{
            var ixy=$('input[name='+ this.xyToggleName +']:checked').val();
            var ixx=0;
            if (ixy==undefined){
                ixx=1;
            }
            $('#'+ this.tableXParentId ).toggle( ixx===0);
            $('#' + this.tableYParentId).toggle( ixx===1);
        });
    }

    addListeners(){
        console.log("as");
        console.log("#"+this.fileUploadId);
        $("#"+this.fileUploadId).change((e)=>{
            console.log("i am here23");
            this.handleFileSelectlocal(e);
        });
        $("#"+this.csvStringUploadId).change(()=>{
            console.log(document.getElementById(this.csvStringUploadId).value);
            this.handleFileSelectstring(document.getElementById(this.csvStringUploadId).value);
          });
        $("#"+this.googleSheetUploadId).change(()=>{
            console.log(document.getElementById(this.googleSheetUploadId).value,"sheetlink");
            var sheetLink=document.getElementById(this.googleSheetUploadId).value;
            var sheetURL="https://spreadsheets.google.com/feeds/list/"+sheetLink.split("/")[5]+"/od6/public/values?alt=json";
            this.getValueGoogleSheet(sheetURL);
        });
        $("#"+this.remoteFileUploadId).change(()=>{
            console.log(document.getElementById(this.remoteFileUploadId).value);
            this.handleFileSelectremote(document.getElementById(this.remoteFileUploadId).value);
        });
        $("#"+this.createSpreadsheetButtonId).click(()=>{
            this.createSheet();
        });

    }



    drawHTMLView(){
        this.element.innerHTML = '<div class="body_container"><div class="main_heading_container"><h2 class="main_heading"> Simple Data Grapher</h2><p class="sub_heading">Plot and Export Graphs with CSV data</p></div><div class="heading_container"><ul class="headings"><li class="item-1">Upload CSV Data</li><li class="item-2">Select Columns & Graph Type</li><li class="item-3">Plotted Graph & Export Options</li></ul></div><div id=' + this.carousalId + ' class="carousel ' + this.carousalClass + ' slide" data-ride="carousel"><div class="indicators"><ol class="carousel-indicators"> <li data-target="#' + this.carousalId + '" data-slide-to="0" class="active" id="up"></li> <li data-target="#' + this.carousalId + '" data-slide-to="1"></li> <li data-target="#' + this.carousalId + '" data-slide-to="2"></li></ol></div><div class="carousel-inner"><div class="carousel-item active"><div class="main_container"><div class="container_drag_drop"><span class="btn btn-outline-primary btn-file input_box"><p class="drag_drop_heading" id=' + this.dragDropHeadingId + '> <u> Choose a csv file </u> or drag & drop it here </p><input type="file" class="csv_file" id=' + this.elementId + "_csv_file" + ' accept=".csv"></span></div><h6 class="or"><span>OR</span></h6><div class="container_remote_link"><input type="text" class="remote_file text_field" placeholder="url of remote file" id=' + this.elementId + "_remote_file" + ' ></div><h6 class="or"><span>OR</span></h6><div class="container_csv_string"><textarea class="csv_string text_field" id=' + this.elementId + "_csv_string" + ' placeholder="Paste a CSV string here" ></textarea></div><h6 class="or"><span>OR</span></h6><div class="container_google_sheet"><input type="text" class="google_sheet text_field" id=' + this.elementId + "_google_sheet" + ' placeholder="Link of published Google Sheet" ></div><div class="upload_button"><button type="button" class="btn btn-primary" id=' + this.uploadButtonId + ' >Upload CSV</button></div></div></div><div class="carousel-item tables"><div class="button_container"><div><input type="checkbox" name=' + this.xyToggleName + ' checked data-toggle="toggle" class="xytoggle" data-width="150" data-onstyle="success" data-offstyle="warning" data-height="40"></div><div class="plot_button"><button type="button" class="btn btn-primary" id=' + this.plotGraphId + ' >Plot Graph</button></div></div><div class="table_container"><div id=' + this.tableXParentId + ' ><table id=' + this.tableXId + ' class="table"></table></div><div id=' + this.tableYParentId + ' class="hidden"><table id=' + this.tableYId + ' class="table"></table></div><div><table id=' + this.graphMenuId + ' class="table table-dark"></table></div></div></div><div class="carousel-item graph"><div class="feature_buttons"><button type="button" class="btn btn-primary" id=' + this.addGraphButtonId + '> Add Graph</button><button type="button" class="btn btn-primary" id=' + this.createSpreadsheetButtonId + '> Create Spreadsheet</button></div><div id=' + this.canvasContinerId + ' ></div></div></div></div></div>';
    
    }
}

export {View}