package com.jiang.th.controller;


import com.jiang.th.entitty.EntryTest;
import com.jiang.th.entitty.Result;
import com.jiang.th.mapper.EntryTestMapper;
import com.jiang.th.service.EntryTestService;
import com.jiang.th.utils.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
public class EntryTestController {
    @Autowired
    private EntryTestService entryTestService;
    @Autowired
    private EntryTestMapper entryTestMapper;
    @Autowired
    private JwtUtil jwtUtils;

    @PostMapping({"/EntryTest"})
    @CrossOrigin("*")
    public Result EntryTest(HttpServletRequest request){
        String jwtToken = (String) request.getHeader("token");
        System.out.println(jwtToken);
        if(jwtToken!=null){
            String user_name = jwtUtils.parseClaimUsername(jwtToken);
            System.out.println("EntryTest");
            if(entryTestService.findUser(user_name) == null){
                System.out.println(Result.error().toString());
                return Result.error(402, "用户还没有完成EntryTest");
            }else {
                System.out.println(Result.success().toString());
                return Result.success("完成EntryTest");
            }
        }else{
            return Result.error(403, "token为空");
        }

    }

    @PostMapping("/EntryTestSubmit")
    @CrossOrigin("*")
    public Result EntryTestSubmit (HttpServletRequest request, @RequestBody EntryTest entryTest) {
        String jwtToken = (String) request.getHeader("token");
        System.out.println(jwtToken);
        String user_name = jwtUtils.parseClaimUsername(jwtToken);

        entryTest.setUser_name(user_name);
        System.out.println("controller提示：用户"+user_name+"正在提交EntryTest");
        if(entryTestService.insertTestUser(entryTest)){
            return Result.success("EntryTest提交成功");
        }else{
            return Result.error(501, "EntryTest提交失败");
        }
    }

}
