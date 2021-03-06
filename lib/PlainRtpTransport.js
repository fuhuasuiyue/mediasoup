"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Logger_1 = require("./Logger");
const Transport_1 = require("./Transport");
const logger = new Logger_1.Logger('PlainRtpTransport');
class PlainRtpTransport extends Transport_1.Transport {
    // PlainRtpTransport data.
    // - .rtcpMux
    // - .comedia
    // - .multiSource
    // - .tuple
    //   - .localIp
    //   - .localPort
    //   - .remoteIp
    //   - .remotePort
    //   - .protocol
    // - .rtcpTuple
    //   - .localIp
    //   - .localPort
    //   - .remoteIp
    //   - .remotePort
    //   - .protocol
    // - .sctpParameters
    //   - .port
    //   - .OS
    //   - .MIS
    //   - .maxMessageSize
    // - .sctpState
    /**
     * @private
     * @emits sctpstatechange - (sctpState: SctpState)
     * @emits trace - (trace: TransportTraceEventData)
     */
    constructor(params) {
        super(params);
        logger.debug('constructor()');
        const { data } = params;
        this._data =
            {
                tuple: data.tuple,
                rtcpTuple: data.rtcpTuple,
                sctpParameters: data.sctpParameters,
                sctpState: data.sctpState
            };
        this._handleWorkerNotifications();
    }
    /**
     * Transport tuple.
     */
    get tuple() {
        return this._data.tuple;
    }
    /**
     * Transport RTCP tuple.
     */
    get rtcpTuple() {
        return this._data.rtcpTuple;
    }
    /**
     * SCTP parameters.
     */
    get sctpParameters() {
        return this._data.sctpParameters;
    }
    /**
     * SCTP state.
     */
    get sctpState() {
        return this._data.sctpState;
    }
    /**
     * Observer.
     *
     * @override
     * @emits close
     * @emits newproducer - (producer: Producer)
     * @emits newconsumer - (producer: Producer)
     * @emits newdataproducer - (dataProducer: DataProducer)
     * @emits newdataconsumer - (dataProducer: DataProducer)
     * @emits sctpstatechange - (sctpState: SctpState)
     * @emits trace - (trace: TransportTraceEventData)
     */
    get observer() {
        return this._observer;
    }
    /**
     * Close the PlainRtpTransport.
     *
     * @override
     */
    close() {
        if (this._closed)
            return;
        if (this._data.sctpState)
            this._data.sctpState = 'closed';
        super.close();
    }
    /**
     * Router was closed.
     *
     * @private
     * @override
     */
    routerClosed() {
        if (this._closed)
            return;
        if (this._data.sctpState)
            this._data.sctpState = 'closed';
        super.routerClosed();
    }
    /**
     * Get PlainRtpTransport stats.
     *
     * @override
     */
    async getStats() {
        logger.debug('getStats()');
        return this._channel.request('transport.getStats', this._internal);
    }
    /**
     * Provide the PlainRtpTransport remote parameters.
     *
     * @override
     */
    async connect({ ip, port, rtcpPort }) {
        logger.debug('connect()');
        const reqData = { ip, port, rtcpPort };
        const data = await this._channel.request('transport.connect', this._internal, reqData);
        // Update data.
        this._data.tuple = data.tuple;
        this._data.rtcpTuple = data.rtcpTuple;
    }
    /**
     * Override Transport.consume() method to reject it if multiSource is set.
     *
     * @override
     */
    async consume(params) {
        if (this._data.multiSource)
            throw new Error('cannot call consume() with multiSource set');
        return super.consume(params);
    }
    _handleWorkerNotifications() {
        this._channel.on(this._internal.transportId, (event, data) => {
            switch (event) {
                case 'sctpstatechange':
                    {
                        const sctpState = data.sctpState;
                        this._data.sctpState = sctpState;
                        this.safeEmit('sctpstatechange', sctpState);
                        // Emit observer event.
                        this._observer.safeEmit('sctpstatechange', sctpState);
                        break;
                    }
                case 'trace':
                    {
                        const trace = data;
                        this.safeEmit('trace', trace);
                        // Emit observer event.
                        this._observer.safeEmit('trace', trace);
                        break;
                    }
                default:
                    {
                        logger.error('ignoring unknown event "%s"', event);
                    }
            }
        });
    }
}
exports.PlainRtpTransport = PlainRtpTransport;
