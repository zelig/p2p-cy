var BACKEND_URL='http://127.0.0.1:8888';

var m;
var s = 0;;
var time_elapsed = new Date();
var interval = function () {
    setInterval(function(){
      s++;
      var temps= s%60;
      m = Math.floor(s/60);
      var val = "" + m + ":" + (temps>9?"":"0") + temps;
      $("#time-elapsed").text(val);
    },1000);
};

var upnodes   = 0;
var uplinks   = 0;


function initializeServer(networkname_){
          $.post(BACKEND_URL).then(
            function(d){
              console.log("Backend POST init ok");
              // initializeMocker(networkname_);
              setTimeout(function(){initializeVisualisationWithClass(networkname_)},1000);
              interval();
},
            function(e) {
              console.log("Error sending POST to " + BACKEND_URL);
              console.log(e);
            })
};

function initializeMocker(networkname_) {
          $.post(BACKEND_URL + "/" + networkname_ + "/mockevents/").then(
            function(d){
              console.log("Backend initializeMocker OK");

            },
            function(e){
              console.log("Error initializing mockevents at " + BACKEND_URL + '0/mockevents/');
              console.log(e);
          })
};

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

                upnodes = self.graphNodes.length;
                $("#nodes-up-count").text(upnodes);

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

                
                uplinks = self.graphLinks.length;
                $("#edges-up-count").text(uplinks);

                self.visualisation.initializeVisualisation(self.graphNodes,self.graphLinks);

                setTimeout(function() {updateVisualisationWithClass(networkname_, 1000, updateVisualisationWithClass)}, 1000);
              },
              function(e){ console.log(e); }
            )
};


function updateVisualisationWithClass(networkname_, delay, callback){

            var self = this;
            $.get(BACKEND_URL + '/' + networkname_ + "/").then(
                function(graph){

                    console.log("Updating visualization with new graph");

                    //new nodes
                    var newNodes = $(graph.add)
                    .filter(function(i,e){return e.group === 'nodes'})
                    .map(function(i,e){ return {id: e.data.id, group: 1}; })
                    .toArray();
                    
                    upnodes += newNodes.length;
                    $("#nodes-up-count").text(upnodes);
                    $("#nodes-add-count").text(newNodes.length);

                    //new connections 
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

                    uplinks += newLinks.length;
                    $("#edges-up-count").text(uplinks);
                    $("#edges-add-count").text(newLinks.length);

                    //down nodes
                    var removeNodes = $(graph.remove)
                    .filter(function(i,e){return e.group === 'nodes'})
                    .map(function(i,e){ return {id: e.data.id, group: 1}; })
                    .toArray();

                    upnodes -= removeNodes.length;
                    $("#nodes-up-count").text(upnodes);
                    $("#nodes-remove-count").text(removeNodes.length);

                    //down connections 
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

                    uplinks -= removeLinks.length;
                    $("#edges-up-count").text(uplinks);
                    $("#edges-remove-count").text(removeNodes.length);

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

						self.visualisation.updateVisualisation(newNodes,newLinks,removeNodes,removeLinks,triggerMsgs);
						setTimeout(function() {callback(networkname_, delay, callback)}, delay);

                } ,
                function(e){ console.log(e); }
            )

};
