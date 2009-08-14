/* $Id: $ */
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is DOI protocol handler 0.1.
 *
 *** This code is heavily cribbed from:
 * The Initial Developer of the Original Code is
 * Roderic D.M. Page (r.page@bio.gla.ac.uk).
 * Portions created by the Initial Developer are Copyright (C) 2004
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

// components defined in this file
const DOIPROT_HANDLER_CONTRACTID 	= "@mozilla.org/network/protocol;1?name=doi";
const HDLPROT_HANDLER_CONTRACTID 	= "@mozilla.org/network/protocol;1?name=hdl";
const DOIPROT_HANDLER_CID 		= Components.ID("{c2e6b7ab-8141-45e9-8c84-e32a825bb104}");
const HDLPROT_HANDLER_CID 		= Components.ID("{9e4c27b0-3ba3-11da-8cd6-0800200c9a66}");

// components used in this file
const NS_IOSERVICE_CID 				= "{9ac9e770-18bc-11d3-9337-00104ba0fd40}";
const NS_PREFSERVICE_CONTRACTID 	= "@mozilla.org/preferences-service;1";
const URI_CONTRACTID 				= "@mozilla.org/network/simple-uri;1";
const NS_WINDOWWATCHER_CONTRACTID 	= "@mozilla.org/embedcomp/window-watcher;1";
const STREAMIOCHANNEL_CONTRACTID 	= "@mozilla.org/network/stream-io-channel;1";

// interfaces used in this file
const nsIProtocolHandler    		= Components.interfaces.nsIProtocolHandler;
const nsIURI                		= Components.interfaces.nsIURI;
const nsISupports           		= Components.interfaces.nsISupports;
const nsIIOService          		= Components.interfaces.nsIIOService;
const nsIPrefService        		= Components.interfaces.nsIPrefService;
const nsIWindowWatcher      		= Components.interfaces.nsIWindowWatcher;
const nsIChannel            		= Components.interfaces.nsIChannel;


/***** ProtocolHandler *****/

function Ten70ProtocolHandler(scheme)
{
    this.scheme = scheme;
}

// attribute defaults
Ten70ProtocolHandler.prototype.defaultPort = -1;
Ten70ProtocolHandler.prototype.protocolFlags = nsIProtocolHandler.URI_NORELATIVE;

Ten70ProtocolHandler.prototype.allowPort = function(aPort, aScheme)
{
    return false;
}

Ten70ProtocolHandler.prototype.newURI = function(aSpec, aCharset, aBaseURI)
{
    var uri = Components.classes[URI_CONTRACTID].createInstance(nsIURI);
    uri.spec = aSpec;
    return uri;
}

Ten70ProtocolHandler.prototype.newChannel = function(aURI)
{
    var handle;
    var proxy;
    var prot;
    
    // Grab the handle from the URI.
    if(aURI.spec.indexOf("://") == 3){
        // This URI is either hdl://...  or doi://...
        handle = aURI.spec.substr( (aURI.spec.indexOf("://") + "://".length) );
    }else{
        // handle looks like hdl:10000.1/1 or doi:10.1570/Ignatius.J.Reilly
        handle = aURI.spec.substr("doi:".length);
    }

    if( this.scheme === "hdl" ){
        proxy = "http://hdl.handle.net/";
    }

    if( this.scheme === "doi" ){
        proxy = "http://dx.doi.org/";
    }
      
    dump("scheme= " + prot + " \nhandle= " + handle + "\nproxy= " + proxy);
 
    var ioServ = Components.classesByID[NS_IOSERVICE_CID].getService();
    ioServ = ioServ.QueryInterface(nsIIOService);
    var uri = ioServ.newURI(proxy+handle, null, null);
    var chan = ioServ.newChannelFromURI(uri);
    return chan;

}


/***** DOIProtocolHandlerFactory *****/

function Ten70ProtocolHandlerFactory(scheme)
{
    this.scheme = scheme;
}

Ten70ProtocolHandlerFactory.prototype.createInstance = function(outer, iid)
{
    if(outer != null) throw Components.results.NS_ERROR_NO_AGGREGATION;

    if(!iid.equals(nsIProtocolHandler) && !iid.equals(nsISupports))
        throw Components.results.NS_ERROR_INVALID_ARG;

    return new Ten70ProtocolHandler(this.scheme);
}

var factory_doi = new Ten70ProtocolHandlerFactory("doi");
var factory_hdl = new Ten70ProtocolHandlerFactory("hdl");

/***** DOIModule *****/

var DOIModule = new Object();

DOIModule.registerSelf = function(compMgr, fileSpec, location, type)
{
    compMgr = compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);

    // register protocol handlers
    compMgr.registerFactoryLocation(DOIPROT_HANDLER_CID,
                                    "DOI protocol handler",
                                    DOIPROT_HANDLER_CONTRACTID,
                                    fileSpec, location, type);

    compMgr.registerFactoryLocation(HDLPROT_HANDLER_CID,
                                    "CNRI Handle protocol handler",
                                    HDLPROT_HANDLER_CONTRACTID,
                                    fileSpec, location, type);
}

DOIModule.unregisterSelf = function(compMgr, fileSpec, location)
{
    compMgr = compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);

    // unregister our components
    compMgr.unregisterFactoryLocation(DOIPROT_HANDLER_CID, fileSpec);
}

DOIModule.getClassObject = function(compMgr, cid, iid)
{
    if(!iid.equals(Components.interfaces.nsIFactory))
        throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

    if(cid.equals(DOIPROT_HANDLER_CID)) return factory_doi;
    if(cid.equals(HDLPROT_HANDLER_CID)) return factory_hdl;

    throw Components.results.NS_ERROR_NO_INTERFACE;
}

DOIModule.canUnload = function(compMgr)
{
    return true;    // our objects can be unloaded
}

/***** Entrypoint *****/

function NSGetModule(compMgr, fileSpec)
{
    return DOIModule;
}
