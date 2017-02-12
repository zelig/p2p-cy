var BACKEND_URL='http://127.0.0.1:8888';

function initializeServer(networkname_){
          $.post(BACKEND_URL).then(
            function(d){
              console.log("Backend POST init ok");
              initializeMocker(networkname_);
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
              setTimeout(function(){initializeVisualisationWithClass(networkname_)},1000);
              
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

                setTimeout(function() {updateVisualisationWithClass(networkname_, 1000, updateVisualisationWithClass)}, 1000);
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
						setTimeout(function() {callback(networkname_, delay, callback)}, delay);
					}

                },
                function(e){ console.log(e); }
            )

};
