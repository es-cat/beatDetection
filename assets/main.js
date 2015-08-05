var offlineContext = {};


function connectChain(arrayObj, destination) {
    console.log("connect");
    arrayObj.forEach(function(element, index, array) {
        if (index != arrayObj.length - 1) {
            element.connect(arrayObj[index + 1]);
        } else {
            element.connect(destination);
        }
    });
}




function bateAnys() {
    //載入音樂，將緩衝綁定到對應的屬性上 this.buffer將會等於後面的mp3檔
    var _this = this;
    loadSounds(this, {
        // buffer: 'chrono.mp3'
        buffer: 'demo.mp3'
    }, function () {
        bateAnysObj.startAnys();
    });

}


bateAnys.prototype.playMusic = function () {
    this.source = context.createBufferSource();
    this.source.buffer = this.buffer;

    var filter = context.createBiquadFilter();
    var analyser = context.createAnalyser();

    var nodes = [this.source, analyser];

    connectChain(nodes, context.destination);



    var cw = 5000;
    var ch = 500;
    var height = 10;
    var rate = 6000; //px 對應 0.5秒
    var peaks = this.peaks;
    var grid = Math.max(Math.floor(cw / peaks[peaks.length - 1].index / rate), 1);
    var canvas = document.querySelector('canvas');
    var drawContext = canvas.getContext('2d');
    var init = false;
    var _this = this;
    context.currentTime = 0;
    function draw() {
        requestAnimationFrame(draw);
        drawContext.fillStyle = 'hsl(' + 200 + ', 100%, 50%)';
        drawContext.fillRect(grid * context.currentTime * (44100 / 12000), ch - height - 1, grid, height);
        if (!init) {
            init = true;
            _this.source.start(0);
        }
        console.log(context.currentTime)
    };
    draw();

};


bateAnys.prototype.getPeaksAtThreshold = function(data, threshold) {
    var peaksArray = [];
    var length = data.length;
    for (var i = 0; i < length;) {

        if (data[i] > threshold) {
            var peak = {
                index: i,
                value: data[i]
            };

            peaksArray.push(peak);
            // Skip forward ~ 1/4s to get past this peak.
            i += 12000;
        }
        i++;
    }
    return peaksArray;
}

bateAnys.prototype.drawBate = function() {
    var peaks = this.peaks;
    var cw = 5000;
    var ch = 500;
    var canvas = document.querySelector('canvas');
    var drawContext = canvas.getContext('2d');
    var count = peaks.length;
    var rate = 6000; //px 對應 0.5秒
    var grid = Math.max(Math.floor(cw / peaks[peaks.length - 1].index / rate), 1);

    canvas.width = cw;
    canvas.height = ch;

    console.log(peaks);
    console.log("peaks count: " + peaks.length);
    console.log('maxgrid' + grid * peaks[peaks.length - 1].index / rate);
    // Draw the frequency domain chart.
    for (var i = 0; i < count; i++) {
        var peak = peaks[i];
        var percent = peak.value;
        var height = ch * peak.value;
        // var barWidth = cw / count;
        var offset = ch - height - 1;
        var hue = i / count * 360;
        // drawContext.fillStyle = 'hsl(' + hue + ', 100%, 50%)';
        drawContext.fillStyle = 'hsl(' + 0 + ', 100%, 50%)';
        drawContext.fillRect(grid * peak.index / rate, offset, grid, height);

        if (i <= 10) {
            console.log("grid: " + grid);
            console.log("bar grid: " + grid * peak.index / rate);
            console.log("bar height: " + height);
            console.log("bar value: " + peak.value);
        }
    }


};


bateAnys.prototype.startAnys = function () {

    offlineContext = new OfflineAudioContext(1, this.buffer.length, this.buffer.sampleRate);

    var bateSource = offlineContext.createBufferSource();
    bateSource.buffer = this.buffer;

    var filter = offlineContext.createBiquadFilter();
    var nodes = [bateSource, filter];
    connectChain(nodes, offlineContext.destination);

    filter.type = "lowpass";
    filter.frequency.value = 219;
    filter.Q.value = 25.5;

    bateSource.start(0);
    offlineContext.startRendering();

    var _this = this;

    offlineContext.oncomplete = function (e) {
        var filteredBuffer = e.renderedBuffer;
        _this.filteredDatas = filteredBuffer.getChannelData(0);
        _this.peaks = _this.getPeaksAtThreshold(_this.filteredDatas, 0);
        // _this.peakIntervals = countIntervalsBetweenNearbyPeaks(_this.peaks);
        _this.drawBate();
        _this.playMusic();
    };
};

function countIntervalsBetweenNearbyPeaks(peaks) {
    var intervalCounts = [];
    peaks.forEach(function(peak, index) {
        for (var i = 0; i < 100; i++) {
        	if(peaks[index + i]){
	            var interval = peaks[index + i].index - peak.index;
	            
	            var foundInterval = intervalCounts.some(function(intervalCount) {
	                if (Math.floor(intervalCount.interval/1200) === Math.floor(interval/1200))
	                    return intervalCount.count++;
	            });

	            if (!foundInterval) {
	                intervalCounts.push({
	                    interval: Math.floor(interval*1200)/1200,
	                    count: 1
	                });
	            }
        	}
        }
    });
    return intervalCounts;
}

var bateAnysObj = new bateAnys();

document.querySelector('.js-bate').addEventListener('click', function() {
    bateAnysObj.startAnys();
});
