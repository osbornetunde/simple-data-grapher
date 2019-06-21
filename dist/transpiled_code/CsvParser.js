"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CsvParser = void 0;

var _SimpleDataGrapher = require("./SimpleDataGrapher");

var _papaparse = _interopRequireDefault(require("papaparse"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var CsvParser =
/*#__PURE__*/
function () {
  //start is variable that will be passed to the function to sort out the columns. start will tell if the existing CSV file has headers or not, therefore, to start the iteration from 0 or 1 Used in header determination
  function CsvParser(file, elementId, functionParameter) {
    _classCallCheck(this, CsvParser);

    _defineProperty(this, 'use strict', void 0);

    _defineProperty(this, "csvFile", null);

    _defineProperty(this, "csvMatrix", []);

    _defineProperty(this, "csvHeaders", []);

    _defineProperty(this, "csvFileStart", 1);

    _defineProperty(this, "completeCsvMatrix", []);

    _defineProperty(this, "completeCsvMatrixTranspose", []);

    _defineProperty(this, "csvSampleData", []);

    _defineProperty(this, "csvValidForYAxis", []);

    _defineProperty(this, "elementId", null);

    this.elementId = elementId;

    if (functionParameter == "local") {
      this.csvFile = file;
      this.parse(functionParameter);
    } else if (functionParameter == "csvstring" || functionParameter == "remote") {
      this.csvMatrix = file;
      console.log("csv matrix", this.csvMatrix);
      this.startFileProcessing(functionParameter);
    } else if (functionParameter == "googleSheet") {
      console.log(file, "file", file[0], file[1]);
      this.completeCsvMatrix = file[1];
      this.csvHeaders = file[0];
      console.log(this.completeCsvMatrix, this.csvHeaders, "did it");
      this.startFileProcessing(functionParameter);
    }
  }

  _createClass(CsvParser, [{
    key: "parse",
    value: function parse(functionParameter) {
      var _this = this;

      var count = 0;

      _papaparse["default"].parse(this.csvFile, {
        download: true,
        dynamicTyping: true,
        comments: true,
        step: function step(row) {
          _this.csvMatrix[count] = row.data[0];
          count += 1;
        },
        complete: function complete() {
          //calling a function to determine headers for columns
          _this.startFileProcessing(functionParameter);
        }
      });
    }
  }, {
    key: "startFileProcessing",
    value: function startFileProcessing(functionParameter) {
      if (functionParameter == "local" || functionParameter == "csvstring" || functionParameter == "remote") {
        this.determineHeaders();
        this.matrixForCompleteData();
        this.extractSampleData();
      } else if (functionParameter == "googleSheet") {
        this.extractSampleData();
      }

      this.createTranspose();
      var self = this;

      _SimpleDataGrapher.SimpleDataGrapher.elementIdSimpleDataGraphInstanceMap[self.elementId].view.continueViewManipulation(self);
    } //preparing sample data for the user to choose the columns from

  }, {
    key: "extractSampleData",
    value: function extractSampleData() {
      var maxval = 5;

      for (var i = 0; i < this.csvHeaders.length; i++) {
        this.csvSampleData[i] = [];
      }

      if (this.completeCsvMatrix.length[0] < 5) {
        maxval = this.completeCsvMatrix[0].length;
      }

      for (var x = 0; x < this.csvHeaders.length; x++) {
        var counter = 0;
        var bool = false;

        for (var j = 0; j < this.completeCsvMatrix[x].length; j++) {
          if (counter >= maxval) {
            break;
          } else if (this.completeCsvMatrix[x][j] !== null || this.completeCsvMatrix[x][j] !== undefined) {
            if (typeof this.completeCsvMatrix[x][j] === 'number') {
              bool = true;
            }

            counter += 1;
            this.csvSampleData[x].push(this.completeCsvMatrix[x][j]);
          }
        }

        if (bool) {
          this.csvValidForYAxis.push(this.csvHeaders[x]);
        }
      }
    } //makes a 2D matrxx with the transpose of the CSV file, each column having the same index as its column heading

  }, {
    key: "matrixForCompleteData",
    value: function matrixForCompleteData() {
      for (var y = 0; y < this.csvHeaders.length; y++) {
        this.completeCsvMatrix[y] = [];
      }

      for (var v = this.csvFileStart; v < this.csvMatrix.length; v++) {
        for (var j = 0; j < this.csvHeaders.length; j++) {
          this.completeCsvMatrix[j].push(this.csvMatrix[v][j]);
        }
      }
    }
  }, {
    key: "determineHeaders",
    value: function determineHeaders() {
      var flag = false;

      for (var i = 0; i < this.csvMatrix[0].length; i++) {
        if (i == 0) {
          this.csvHeaders[i] = this.csvMatrix[0][i];
        } else {
          if (_typeof(this.csvMatrix[0][i]) == _typeof(this.csvMatrix[0][i - 1]) && _typeof(this.csvMatrix[0][i]) != 'object') {
            this.csvHeaders[i] = this.csvMatrix[0][i];
          } else if (_typeof(this.csvMatrix[0][i]) == 'object') {
            this.csvHeaders[i] = "Column" + (i + 1);
          } else {
            flag = true;
            break;
          }
        }
      } //if there are no headers present, make dummy header names


      if (flag && this.csvHeaders.length != this.csvMatrix[0].length) {
        this.csvFileStart = 0;

        for (var u = 0; u < this.csvMatrix[0].length; u++) {
          this.csvHeaders[u] = "Column" + (u + 1);
        }
      }
    }
  }, {
    key: "createTranspose",
    value: function createTranspose() {
      for (var i = 0; i <= this.completeCsvMatrix[0].length; i++) {
        this.completeCsvMatrixTranspose[i] = [];
      }

      for (var v = 0; v < this.completeCsvMatrix.length; v++) {
        this.completeCsvMatrixTranspose[0][v] = this.csvHeaders[v];
      }

      for (var s = 0; s < this.completeCsvMatrix.length; s++) {
        for (var j = 0; j < this.completeCsvMatrix[0].length; j++) {
          this.completeCsvMatrixTranspose[j + 1][s] = this.completeCsvMatrix[s][j];
        }
      }
    }
  }]);

  return CsvParser;
}();

exports.CsvParser = CsvParser;