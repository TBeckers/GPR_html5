// by Thomas Beckers, 2020
// t.beckers@tum.de

class gpr {
	constructor() {
    this.kernel = this.kernel_sq;
	this.X = [];
	this.Y = [];
	this.min_noise = 1/1000000;
  }
	
	set kernel_fcn(kernel_name) {
		console.log(kernel_name);
		if (kernel_name=='kernel_sq'){
			this.kernel=this.kernel_sq;
		} else if (kernel_name=='kernel_quad'){
			this.kernel=this.kernel_quad;
		} else if (kernel_name=='kernel_lin'){
			this.kernel=this.kernel_lin;
		} else if (kernel_name=='kernel_mat'){
			this.kernel=this.kernel_mat;
		} else if (kernel_name=='kernel_per'){
			this.kernel=this.kernel_per;
		} else {
			this.kernel=this.kernel_sq;
		}
	}
	
	set X_data(X) {
		this.X=X;
	}
	
	set Y_data(Y) {
		this.Y=Y;
	}
  
	
	kernel_wrapper(a,b,sf,l,sn,modus){
		var la=a.length;
		var lb=b.length;
		var out=math.zeros([la,lb]);
		
		if (modus==1){	
			for (var i=0; i<la; i++){
				for (var j=i; j<lb; j++){
					if (i==j){
						out[i][j]=this.kernel(a[i],b[j],sf,l)+sn*sn+this.min_noise;
					} else{
						out[i][j]=this.kernel(a[i],b[j],sf,l);
					}
					out[j][i]=out[i][j];
				}
			}
		} else if (modus==2){
			for (var i=0; i<la; i++){
					out[i][i]=this.kernel(a[i],b[i],sf,l);
			}
		} else {
			for (var i=0; i<la; i++){
				for (var j=0; j<lb; j++){
					out[i][j]=this.kernel(a[i],b[j],sf,l);
				}
			}
		}
		return out;
	}
	
	kernel_sq(a,b,sf,l){
		var d=a-b;
		return sf*sf*math.exp(-d*d/l/l);
	}
	
	
	kernel_per(a,b,sf,l){
		var d=math.sin(math.pi*math.abs(a-b)/0.4)
		return sf*sf*math.exp(-2/l/l*d*d);
	}
	
	kernel_mat(a,b,sf,l){
		return sf*sf*math.exp(-math.abs(a-b)/l);
	}
	
	kernel_lin(a,b,sf,l){
		return sf*sf*a*b+l;
	}
	
	kernel_quad(a,b,sf,l){
		var d=a*b+l;
		return sf*sf*d*d;
	}
	
	pred (x,sn,sf,l){
		var lX=this.X.length;
		
		var K=this.kernel_wrapper(this.X,this.X,sf,l,sn,1)
		var Kinv= math.inv(K);
		var kvec= this.kernel_wrapper(x,this.X,sf,l,sn,0);
		var kmut = math.multiply(kvec,Kinv);
		var mean_int = math.multiply(kmut,math.transpose(this.Y));
		
		var sn_int = math.sqrt(math.diag(math.subtract(this.kernel_wrapper(x,x,sf,l,sn,2),math.multiply(kmut,math.transpose(kvec)))));
		var ll_int = this.loglik2(sn,sf,l,K,Kinv);
		return {
			mean: mean_int,
			sigma: sn_int,
			ll: ll_int,
		};
	}
	
	loglik (x,X,Y){
		var sn=x[0];
		var sf=x[1];
		var l=x[2];
		var lY=Y.length;
		var K=this.kernel_wrapper(X,X,sf,l,sn,1);
		var Kinv= math.inv(K);
		
		return 0.5 * (math.multiply(math.multiply(math.transpose(Y),Kinv),Y) + math.log(math.det(K)) + lY*0.79817986); //log(2*pi)
	}
	
	loglik2(sn,sf,l,K,Kinv){
	
		var lY=this.Y.length;
		
		return 0.5*(math.multiply(math.multiply(math.transpose(this.Y),Kinv),this.Y)+math.log(math.det(K))+lY*0.79817986)
	}
	
	
}