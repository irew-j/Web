package kr.ac.hs.RandomTrip.auth.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.*;

@Getter
@Setter
public class MemberDto {
    private String username;
    private String displayName;
    private Long id;
    private String password;
    private List<String> authorities;

    public MemberDto() {
    }

    public MemberDto(String username, String displayName) {
        this.username = username;
        this.displayName = displayName;
    }

    public MemberDto(String username, String displayName, Long id) {
        this.username = username;
        this.displayName = displayName;
        this.id = id;
    }

}