package com.jiang.th.config;

import com.jiang.th.utils.JwtUtil;
import jakarta.websocket.HandshakeResponse;
import jakarta.websocket.server.HandshakeRequest;
import jakarta.websocket.server.ServerEndpointConfig;

public class GetTokenConfigurator extends ServerEndpointConfig.Configurator{
    @Override
    public void modifyHandshake(ServerEndpointConfig sec, HandshakeRequest request, HandshakeResponse response){
        String jwt = request.getHeaders().toString();
        sec.getUserProperties().put(JwtUtil.parseClaimUsername(jwt), jwt);
    }
}
