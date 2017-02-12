var BACKEND_URL='http://127.0.0.1:8888'; // our sim server
var networkname = "metaschmeta"; // what to call the REST entry point
var cursor = 0; // the index of the current (event invoking) request being posted

var prereqs = [
	{method: "POST", url: "/node", payload: null,},
	{method: "POST", url: "/node", payload: null,},	
	{method: "POST", url: "/node", payload: null,},	
	{method: "POST", url: "/node", payload: null,},
	{method: "POST", url: "/node", payload: null,},	
	{method: "POST", url: "/node", payload: null,},	
	{method: "POST", url: "/node", payload: null,},
	{method: "POST", url: "/node", payload: null,},	
	{method: "POST", url: "/node", payload: null,},	
	{method: "POST", url: "/node", payload: null,},	
	
	{method: "PUT", url: "/node", payload: {One: 1},},
	{method: "PUT", url: "/node", payload: {One: 2},},
	{method: "PUT", url: "/node", payload: {One: 3},},
	{method: "PUT", url: "/node", payload: {One: 4},},
	{method: "PUT", url: "/node", payload: {One: 5},},
	{method: "PUT", url: "/node", payload: {One: 6},},
	{method: "PUT", url: "/node", payload: {One: 7},},
	{method: "PUT", url: "/node", payload: {One: 8},},
	{method: "PUT", url: "/node", payload: {One: 9},},
	{method: "PUT", url: "/node", payload: {One: 10},},
	
	{method: "PUT", url: "/node", payload: {One: 1, Other: 2}},
	{method: "PUT", url: "/node", payload: {One: 2, Other: 3}},
	{method: "PUT", url: "/node", payload: {One: 3, Other: 4}},
	{method: "PUT", url: "/node", payload: {One: 4, Other: 5}},
	{method: "PUT", url: "/node", payload: {One: 5, Other: 6}},
	{method: "PUT", url: "/node", payload: {One: 6, Other: 7}},
	{method: "PUT", url: "/node", payload: {One: 7, Other: 8}},
	{method: "PUT", url: "/node", payload: {One: 8, Other: 9}},
	{method: "PUT", url: "/node", payload: {One: 9, Other: 10}},
	{method: "PUT", url: "/node", payload: {One: 10, Other: 1}},
	
]

var postreqs = [
	{method: "PUT", url: "/node", payload: {One: 1, Other: 2, AssetType: 1}},
	{method: "PUT", url: "/node", payload: {One: 5, Other: 6, AssetType: 1}},
	//{method: "PUT", url: "/node", payload: {One: 1, Other: 2, AssetType: 1}},
]

function initializeServer(){
		console.log("we have a snapshot of " + prereqs.length + " requests and animation of " + postreqs.length + " requests linedup for you in this run");
          $.post(BACKEND_URL + "/", JSON.stringify({"Id":networkname})).then(
            function(d){
              console.log("Backend POST init ok");
              preSequence(networkname);
				
            },
            function(e) { 
              console.log("Error sending POST to " + BACKEND_URL); 
              console.log(e); 
            })
};

function preSequence(networkname_) {
	
	if (cursor == prereqs.length)
		return false;
		
	var effectiveurl = BACKEND_URL + "/" + networkname_ + prereqs[cursor].url + "/";
	$.ajax({
		type: prereqs[cursor].method,
		url: effectiveurl,
		dataType: "json",
		mimeType: "application/json",
		data: JSON.stringify(prereqs[cursor].payload),
	}).done(function() {
		cursor++;
		
		if (cursor == prereqs.length) {
			initializeVisualisationWithClass(networkname);
			
		} else {
			preSequence(networkname_);
		}
	});	
	
	return true;
}

function postSequence(networkname_) {
	
	if (cursor == postreqs.length)
		return false;
		
	var effectiveurl = BACKEND_URL + "/" + networkname_ + postreqs[cursor].url + "/";
	$.ajax({
		type: postreqs[cursor].method,
		url: effectiveurl,
		dataType: "json",
		mimeType: "application/json",
		data: JSON.stringify(postreqs[cursor].payload),
	}).done(function() {
		cursor++;
		updateVisualisationWithClass(networkname, 500, postSequence);
	});	
	
	return true;
}

function initializeVisualisationWithClass(networkname_){

            console.log("Initializing visualization");
            var self = this;

            this.visualisation 
                = window.visualisation 
                = new P2Pd3(d3.select("svg"));

            $.get(BACKEND_URL + '/' + networkname_ + "/").then(
              function(graph){
                console.log("Received graph data from backend");
                self.graphNodes = $(graph.add)
                    .filter(function(i,e){return e.group === 'nodes'})
                    .map(function(i,e){ 
                    return {
                      id: e.data.id, 
                      group: 1,
                      balance: 111,
                      kademlia: {
                        list: [
                          {
                            ip: '111.111.111.111',
                            port: '80',
                            node_id: 'aaaaa',
                            distance: '1'
                          },
                          {
                            ip: '222.222.222.222',
                            port: '81',
                            node_id: 'bbbbb',
                            distance: '2'
                          },
                          {
                            ip: '333.333.333.333',
                            port: '82',
                            node_id: 'ccccc',
                            distance: '3'
                          }
                        ]
                      }
                      }; 
                    })
                    .toArray();

                self.graphLinks = $(graph.add)
                    .filter(function(i,e){return e.group === 'edges'})
                    .map(function(i,e){ 
                        return {
                            source: e.data.source, 
                            target: e.data.target, 
                            group: 1,
                            value: i
                        };
                    })
                    .toArray();
				
				
                    
                self.visualisation.initializeVisualisation(self.graphNodes,self.graphLinks);

                //self.visualisationInterval = setInterval(updateVisualisationWithClass,1000);
                //setTimeOut(function() {updateVisualisationWithClass(networkname_, 1, testPostSequence)}, 0);
                //updateVisualisationWithClass(networkname_, 1, testPostSequence)
                cursor = 0;
                setTimeout(function() {postSequence(networkname_)}, 2000);
              },
              function(e){ console.log(e); }
            )
};


function updateVisualisationWithClass(networkname_, delay, callback){

            var self = this;
            $.get(BACKEND_URL + '/' + networkname_ + "/").then(
                function(graph){
                    
                    var newNodes = $(graph.add)
                    .filter(function(i,e){return e.group === 'nodes'})
                    .map(function(i,e){ return {id: e.data.id, group: 1}; })
                    .toArray();

                    var newLinks = $(graph.add)
                    .filter(function(i,e){return e.group === 'edges'})
                    .map(function(i,e){ 
                        return {
                            source: e.data.source, 
                            target: e.data.target, 
                            group: 1,
                            value: i
                        };
                    })
                    .toArray();

                    var removeNodes = $(graph.remove)
                    .filter(function(i,e){return e.group === 'nodes'})
                    .map(function(i,e){ return {id: e.data.id, group: 1}; })
                    .toArray();

                    var removeLinks = $(graph.remove)
                    .filter(function(i,e){return e.group === 'edges'})
                    .map(function(i,e){ 
                        return {
                            source: e.data.source, 
                            target: e.data.target, 
                            group: 1,
                            value: i
                        };
                    })
                    .toArray();
					
					var triggerMsgs = $(graph.add)
                    .filter(function(i,e){return e.group === 'msgs'})
                    .map(function(i,e){ 
                        return {
                            source: e.data.source, 
                            target: e.data.target, 
                            group: 1,
                            value: i
                        };
                    })
                    .toArray();
                    
					if(newNodes.length > 0 || newLinks.length > 0 || removeNodes.length > 0 || removeLinks.length > 0 || triggerMsgs.length > 0) {
						self.visualisation.updateVisualisation(newNodes,newLinks,removeNodes,removeLinks,triggerMsgs);
						setTimeout(function() {callback(networkname_)}, delay);
					}
                    
                },
                function(e){ console.log(e); }
            )

};
