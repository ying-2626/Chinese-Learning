package com.jiang.th.entitty;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class User {
    private String user_name;
    private String user_password;
    private String user_id;
    private String user_email;

    public String getuser_password_decoder(){
        String decoderPassword = new String(Base64.getDecoder().decode(user_password), StandardCharsets.UTF_8);
        return decoderPassword;
    }

    public void setuser_passsword_decoder(String password){
        String decoderPassword = new String(Base64.getDecoder().decode(user_password), StandardCharsets.UTF_8);
        this.user_password = decoderPassword;
    }
}
