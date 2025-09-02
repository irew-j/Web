package kr.ac.hs.RandomTrip.auth.security;

import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;

import java.util.Collection;

@Getter
public class CustomUser extends User {
    // displayName을 private final로 선언하여 캡슐화하고, Lombok의 @Getter로 getter 자동 생성
    private final String displayName;
    
    public CustomUser(
            String username,
            String password,
            Collection<? extends GrantedAuthority> authorities,
            String displayName
    ) {
        super(username, password, authorities);
        this.displayName = displayName;
    }
} 