import Axios, {
  AxiosRequestConfig,
  AxiosPromise,
  AxiosResponse,
  AxiosError,
} from "axios";

export default class AxiosRateLimited {
  maxRequests: number;
  waitingRequests: Array<AxiosRequestConfig>;
  sentRequests: Array<AxiosPromise>;
  doneRequests: Array<AxiosResponse>;

  constructor(number: number) {
    this.maxRequests = number;
    this.waitingRequests = [];
    this.sentRequests = [];
    this.doneRequests = [];
    this.interval();
  }

  interval = () => {
    if (this.waitingRequests.length > 0) {
      this.waitingRequests.map((request) => {
        if (this.sentRequests.length < this.maxRequests) {
          let axiosReq = Axios(request);
          this.sentRequests.push(axiosReq);
          this.waitingRequests.splice(this.waitingRequests.indexOf(request), 1);
          axiosReq
            .then((done) => {
              this.doneRequests.push(done.data);
              this.sentRequests.splice(this.sentRequests.indexOf(axiosReq), 1);
            })
            .catch((err) => {
              this.doneRequests.push(err);
              this.sentRequests.splice(this.sentRequests.indexOf(axiosReq), 1);
            });
          console.log(
            this.waitingRequests,
            this.sentRequests,
            this.maxRequests
          );
        }
      });
    }
    setTimeout(this.interval, 1000);
  };

  getMaxRequests = () => {
    return this.maxRequests;
  };

  getWaitingRequests = (): Array<AxiosRequestConfig> => {
    return this.waitingRequests;
  };

  getSentRequests = (): Array<AxiosPromise> => {
    return this.sentRequests;
  };

  getDoneRequests = (): Array<AxiosResponse> => {
    return this.doneRequests;
  };

  addRequest = (request: AxiosRequestConfig) => {
    this.waitingRequests.push(request);
  };

  waitForAll = async () => {
    return new Promise((resolve, reject) => {
      let init = this;
      (function test() {
        if (init.waitingRequests.length > 0 || init.sentRequests.length > 0) {
          setTimeout(test, 1000);
        } else {
          resolve(init.doneRequests);
        }
      })();
    });
  };
}
