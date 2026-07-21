package com.epiis.apibiblioteca.generic;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResponseDataGeneric<T> extends ResponseGeneric {
    private T data;

    public ResponseDataGeneric() {
        super();
    }

    public ResponseDataGeneric(T data) {
        super();
        this.data = data;
        this.success();
    }
}
