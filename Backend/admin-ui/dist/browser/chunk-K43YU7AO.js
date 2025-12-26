import{Ca as a,Da as l,De as T,Ea as h,Ma as E,Pg as $,Qa as I,Qf as N,Sa as P,Sf as k,T as v,U as C,Za as b,_ as r,aa as _,ca as x,gb as q,ha as f,ig as L,ja as d,jg as A,kh as j,ma as t,na as i,ob as u,rg as D,sa as S,ta as p,ua as c,ue as y,wb as R}from"./chunk-WG4HMO6N.js";var B=o=>["/orders",o];function M(o,g){if(o&1){let e=S();t(0,"div",6)(1,"button",7),p("click",function(){v(e);let s=c().item,m=c();return C(m.approve(s.id))}),a(2," \u2713 Approve "),i(),t(3,"button",8),p("click",function(){v(e);let s=c().item,m=c();return C(m.reject(s.id))}),a(4," \u2717 Reject "),i()()}}function V(o,g){if(o&1&&(t(0,"span",9),a(1),i()),o&2){let e=c().item;r(),h(" ",e.adminNote||"No action"," ")}}function F(o,g){if(o&1&&(t(0,"td",1),a(1),i(),t(2,"td",1)(3,"a",2),a(4),i()(),t(5,"td",1),a(6),i(),t(7,"td",1),a(8),i(),t(9,"td",1)(10,"vdr-badge",3),a(11),i()(),t(12,"td",1),a(13),i(),t(14,"td",1),a(15),I(16,"date"),i(),t(17,"td",1),f(18,M,5,0,"div",4)(19,V,2,1,"span",5),i()),o&2){let e=g.item,n=c();r(),l(e.id),r(2),d("routerLink",E(14,B,e.orderId)),r(),l(e.orderCode),r(2),l(e.requestedBy),r(2),l(e.requestedQuantity),r(2),d("type",n.getBadgeType(e.status)),r(),l(e.status),r(2),l(e.reason),r(2),l(P(16,11,e.createdAt,"short")),r(3),d("ngIf",e.status==="PENDING"),r(),d("ngIf",e.status!=="PENDING")}}var G=u`
  query GetCancellationRequests($skip: Int, $take: Int) {
    cancellationRequests(skip: $skip, take: $take) {
      items {
        id
        orderId
        orderCode
        orderLineId
        requestType
        requestedQuantity
        status
        reason
        requestedBy
        createdAt
        adminNote
      }
      total
    }
  }
`,Q=u`
  mutation ApproveCancellation($id: ID!, $adminNote: String) {
    approveCancellationRequest(id: $id, adminNote: $adminNote) {
      id
      status
    }
  }
`,U=u`
  mutation RejectCancellation($id: ID!, $adminNote: String!) {
    rejectCancellationRequest(id: $id, adminNote: $adminNote) {
      id
      status
    }
  }
`,O=(()=>{class o{constructor(e,n){this.dataService=e,this.notificationService=n,this.items=[],this.totalItems=0,this.currentPage=1,this.itemsPerPage=10}ngOnInit(){this.loadRequests()}loadRequests(){let e=(this.currentPage-1)*this.itemsPerPage;this.dataService.query(G,{skip:e,take:this.itemsPerPage}).mapSingle(n=>n.cancellationRequests).subscribe(n=>{this.items=n.items,this.totalItems=n.total},n=>{this.notificationService.error("Failed to load cancellation requests")})}onPageChange(e){this.currentPage=e,this.loadRequests()}approve(e){let n=prompt("Add approval note (optional):");this.dataService.mutate(Q,{id:e,adminNote:n}).subscribe(()=>{this.notificationService.success("Cancellation request approved"),this.loadRequests()},s=>{this.notificationService.error("Failed to approve request")})}reject(e){let n=prompt("Add rejection note (required):");if(!n){this.notificationService.error("Rejection note is required");return}this.dataService.mutate(U,{id:e,adminNote:n}).subscribe(()=>{this.notificationService.success("Cancellation request rejected"),this.loadRequests()},s=>{this.notificationService.error("Failed to reject request")})}getBadgeType(e){switch(e){case"APPROVED":return"success";case"REJECTED":return"error";default:return"warning"}}static{this.\u0275fac=function(n){return new(n||o)(_(y),_(T))}}static{this.\u0275cmp=x({type:o,selectors:[["cancellation-list"]],decls:23,vars:4,consts:[[3,"pageChange","items","itemsPerPage","totalItems","currentPage"],[1,"left","align-middle"],[3,"routerLink"],[3,"type"],["class","flex gap-2",4,"ngIf"],["class","text-muted",4,"ngIf"],[1,"flex","gap-2"],["type","button",1,"btn","btn-sm","btn-success",3,"click"],["type","button",1,"btn","btn-sm","btn-danger",3,"click"],[1,"text-muted"]],template:function(n,s){n&1&&(t(0,"vdr-page-block")(1,"vdr-action-bar")(2,"vdr-ab-left")(3,"h2"),a(4,"Cancellation Requests"),i()()()(),t(5,"vdr-data-table",0),p("pageChange",function(w){return s.onPageChange(w)}),t(6,"vdr-dt-column"),a(7,"ID"),i(),t(8,"vdr-dt-column"),a(9,"Order Code"),i(),t(10,"vdr-dt-column"),a(11,"Customer"),i(),t(12,"vdr-dt-column"),a(13,"Quantity"),i(),t(14,"vdr-dt-column"),a(15,"Status"),i(),t(16,"vdr-dt-column"),a(17,"Reason"),i(),t(18,"vdr-dt-column"),a(19,"Date"),i(),t(20,"vdr-dt-column"),a(21,"Actions"),i(),f(22,F,20,16,"ng-template"),i()),n&2&&(r(5),d("items",s.items)("itemsPerPage",s.itemsPerPage)("totalItems",s.totalItems)("currentPage",s.currentPage))},dependencies:[$,b,q,R,k,N,A,L,D],styles:[`.flex[_ngcontent-%COMP%]{display:flex}.gap-2[_ngcontent-%COMP%]{gap:.5rem}
/*# sourceMappingURL=cancellation-list.component-YSLTLXSK.css.map */`]})}}return o})();var te=[j({component:O,path:"",title:"Cancellation Requests",breadcrumb:"Cancellation Requests"})];export{te as default};
//# sourceMappingURL=chunk-K43YU7AO.js.map
