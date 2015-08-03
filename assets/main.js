var offlineContext = {};


function connectChain(arrayObj,destination) {
	console.log("connect");
	arrayObj.forEach(function(element, index, array){
		if(index != arrayObj.length-1){
			element.connect(arrayObj[index+1]);
		}else {
			element.connect(destination);
		}
	});	
}




function bateAnys(){
    //載入音樂，將緩衝綁定到對應的屬性上 this.buffer將會等於後面的mp3檔
    var _this = this;
    loadSounds(this, {
    	buffer: 'chrono.mp3'
    	// buffer: 'demo.mp3'
    });
	
}


bateAnys.prototype.playMusic = function(){
	this.source = context.createBufferSource();
	this.source.buffer = this.buffer;	
	
	var filter = context.createBiquadFilter();
	filter.type = "lowpass";

	var nodes = [this.source,filter];

	connectChain(nodes, context.destination);

	this.source.start(0);
	
};


bateAnys.prototype.getPeaksAtThreshold = function(data, threshold) {
  var peaksArray = [];
  var length = data.length;
  for(var i = 0; i < length;) {

    if (data[i] > threshold) {
		var peak = {
		    index: i,
		    value:data[i]
		};

      peaksArray.push(peak);
      // Skip forward ~ 1/4s to get past this peak.
      i += 10000;
    }
    i++;
  }
  return peaksArray;
}



bateAnys.prototype.drawBate = function(){
	var peaks = this.peaks;
	var cw = 5000;
	var ch = 100;
    var canvas = document.querySelector('canvas');
    var drawContext = canvas.getContext('2d');
    var count = peaks.length;
    var rate = 12000; //px 對應 0.5秒
    var grid = Math.max(Math.floor(cw/peaks[peaks.length-1].index/rate),1);

    canvas.width = cw;
    canvas.height = ch;
    // Draw the frequency domain chart.
    for (var i = 0; i < count; i++) {
        var peak = peaks[i];
        var percent = peak.value;
        var height = ch*peak.value;
        // var barWidth = cw / count;
        var offset = ch - height - 1;
        var hue = i / count * 360;
        // drawContext.fillStyle = 'hsl(' + hue + ', 100%, 50%)';
        drawContext.fillStyle = 'hsl(' + 0 + ', 100%, 50%)';
        drawContext.fillRect(grid*peak.index/rate,offset,grid, height);

        if(i<=1){
		    console.log(peaks);
		    console.log(peaks.length);
		    console.log(grid);
		    console.log("grid:"+grid*peak.index/rate);
		    console.log(height);
		    console.log('maxgrid'+grid*peaks[peaks.length-1].index/rate);
        }
    }


};


bateAnys.prototype.startAnys = function(){
	
	offlineContext = new OfflineAudioContext(1, this.buffer.length, this.buffer.sampleRate);

	var bateSource = offlineContext.createBufferSource();
	bateSource.buffer = this.buffer;	
	
	var filter = offlineContext.createBiquadFilter();
	filter.type = "lowpass";

	var nodes = [bateSource];

	connectChain(nodes,offlineContext.destination);
	
	bateSource.start(0);
	offlineContext.startRendering();

	var _this = this;

    offlineContext.oncomplete = function(e) {
		var filteredBuffer = e.renderedBuffer;
		_this.filteredDatas = filteredBuffer.getChannelData(0);
		_this.peaks = _this.getPeaksAtThreshold(_this.filteredDatas,0.25);
		
		_this.drawBate();
		_this.playMusic();
    };



};


var bateAnysObj = new bateAnys();

document.querySelector('.js-bate').addEventListener('click', function() {
	bateAnysObj.startAnys();
});

